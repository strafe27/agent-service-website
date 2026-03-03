import asyncio
import os
import json
import uuid
from datetime import datetime
import aiohttp
import aiohttp.web
from aiohttp import WSMessage, WSMsgType

HOST = os.getenv('HOST', '0.0.0.0')
PORT = int(os.getenv('PORT', 8081))

# Global state to keep track of connections and chats
# In a real app, this would be in a database (e.g., Redis)
active_chats = {} # chat_id -> chat_info
customer_connections = {} # customer_email -> ws
admin_connections = set() # set of admin ws

ADK_BASE_URL = os.getenv('ADK_BASE_URL', 'http://localhost:8000')
APP_NAME = "ai_agents"
USER_ID = "admin-dashboard"

async def get_ai_suggestion(chat_id, messages):
    session_id = f"session-{chat_id}"
    
    # ADK uses specific user and session paths
    session_url = f"{ADK_BASE_URL}/apps/{APP_NAME}/users/{USER_ID}/sessions/{session_id}"
    run_url = f"{ADK_BASE_URL}/run"

    print(f"\n--- REQUESTING AI SUGGESTION ---")
    print(f"Chat ID: {chat_id}")

    try:
        async with aiohttp.ClientSession() as session:
            # 1. Ensure session exists (ADK requires this)
            # Use GET first to see if it exists, or just catch the 409
            async with session.get(session_url) as resp:
                if resp.status != 200:
                    async with session.post(session_url, json={}) as post_resp:
                        pass

            # 2. Format the latest message for ADK
            # In a suggestion context, we send the whole history as a single turn
            # or just the last customer message. Let's send the last message but
            # include the previous history in the prompt for context.
            
            history_str = ""
            for msg in messages[:-1]:
                role = "Customer" if msg['sender'] == 'customer' else "You"
                history_str += f"{role}: {msg['text']}\n"
            
            last_msg = messages[-1]['text'] if messages else "Hi"
            prompt = f"History:\n{history_str}\nLatest Customer Message: {last_msg}\nSuggest a response based on your system instruction."

            print(f"Sending Prompt to ADK: {prompt}...")

            # 3. Run the agent
            payload = {
                "app_name": APP_NAME,
                "user_id": USER_ID,
                "session_id": session_id,
                "new_message": {
                    "role": "user",
                    "parts": [{"text": prompt}]
                }
            }
            
            async with session.post(run_url, json=payload) as resp:
                if resp.status == 200:
                    events = await resp.json()
                    assistant_text = ""
                    for event in events:
                        if "content" in event:
                            parts = event["content"].get("parts", [])
                            if parts and "text" in parts[0]:
                                assistant_text += parts[0]["text"]
                    
                    print(f"AI Suggestion Received: {assistant_text[:100]}...")
                    return assistant_text or "No suggestion generated."
                else:
                    error_text = await resp.text()
                    print(f"ADK Server Error ({resp.status}): {error_text}")
                    return f"ADK Server Error: {resp.status}"
    except Exception as e:
        print(f"Connection to AI Brain failed: {str(e)}")
        return f"Connection to AI Brain failed: {str(e)}"

async def handle_customer_ws(ws, email):
    customer_connections[email] = ws
    try:
        async for msg in ws:
            if msg.type == WSMsgType.TEXT:
                data = json.loads(msg.data)
                action = data.get('action')
                print(f"[WS CUSTOMER] Action: {action}, Data: {data}")
                
                if action == 'start_chat':
                    chat_id = str(uuid.uuid4())
                    reason = data.get('reason')
                    chat_info = {
                        'id': chat_id,
                        'customerEmail': email,
                        'reason': reason,
                        'status': 'active',
                        'messages': [],
                        'lastMessageTime': datetime.now().isoformat()
                    }
                    active_chats[chat_id] = chat_info
                    
                    # Notify admins about new chat
                    broadcast_to_admins({
                        'type': 'new_chat',
                        'chat': chat_info
                    })
                    
                    await ws.send_json({
                        'type': 'chat_started',
                        'chatId': chat_id
                    })
                    
                elif action == 'send_message':
                    chat_id = data.get('chatId')
                    text = data.get('text')
                    if chat_id in active_chats:
                        message = {
                            'id': str(uuid.uuid4()),
                            'text': text,
                            'sender': 'customer',
                            'timestamp': datetime.now().isoformat()
                        }
                        active_chats[chat_id]['messages'].append(message)
                        active_chats[chat_id]['lastMessageTime'] = message['timestamp']
                        
                        # Notify admins
                        broadcast_to_admins({
                            'type': 'message',
                            'chatId': chat_id,
                            'message': message
                        })

                        # Auto-trigger AI suggestion for admins
                        asyncio.create_task(broadcast_suggestion_to_admins(chat_id))
            elif msg.type == WSMsgType.ERROR:
                print(f'Customer ws closed with exception {ws.exception()}')
    finally:
        if email in customer_connections:
            del customer_connections[email]

async def handle_admin_ws(ws):
    admin_connections.add(ws)
    try:
        # Send current active chats to the new admin
        await ws.send_json({
            'type': 'init',
            'chats': list(active_chats.values())
        })
        
        async for msg in ws:
            if msg.type == WSMsgType.TEXT:
                data = json.loads(msg.data)
                action = data.get('action')
                print(f"[WS ADMIN] Action: {action}, Data: {data}")
                
                if action == 'get_history':
                    chat_id = data.get('chatId')
                    if chat_id in active_chats:
                        await ws.send_json({
                            'type': 'chat_history',
                            'chatId': chat_id,
                            'chat': active_chats[chat_id]
                        })

                elif action == 'request_ai_suggestion':
                    chat_id = data.get('chatId')
                    if chat_id in active_chats:
                        chat = active_chats[chat_id]
                        suggestion = await get_ai_suggestion(chat_id, chat['messages'])
                        await ws.send_json({
                            'type': 'ai_suggestion',
                            'chatId': chat_id,
                            'suggestion': suggestion
                        })

                elif action == 'send_message':
                    chat_id = data.get('chatId')
                    text = data.get('text')
                    if chat_id in active_chats:
                        chat = active_chats[chat_id]
                        message = {
                            'id': str(uuid.uuid4()),
                            'text': text,
                            'sender': 'admin',
                            'timestamp': datetime.now().isoformat()
                        }
                        chat['messages'].append(message)
                        chat['lastMessageTime'] = message['timestamp']
                        
                        # Notify customer
                        customer_email = chat['customerEmail']
                        if customer_email in customer_connections:
                            await customer_connections[customer_email].send_json({
                                'type': 'message',
                                'message': message
                            })
                        
                        # Notify other admins
                        broadcast_to_admins({
                            'type': 'message',
                            'chatId': chat_id,
                            'message': message
                        }, skip_ws=ws)
            elif msg.type == WSMsgType.ERROR:
                print(f'Admin ws closed with exception {ws.exception()}')
    finally:
        admin_connections.remove(ws)

def broadcast_to_admins(data, skip_ws=None):
    for ws in admin_connections:
        if ws != skip_ws:
            asyncio.create_task(ws.send_json(data))

async def broadcast_suggestion_to_admins(chat_id):
    if chat_id in active_chats:
        chat = active_chats[chat_id]
        suggestion = await get_ai_suggestion(chat_id, chat['messages'])
        broadcast_to_admins({
            'type': 'ai_suggestion',
            'chatId': chat_id,
            'suggestion': suggestion
        })

async def websocket_handler(request):
    ws = aiohttp.web.WebSocketResponse()
    await ws.prepare(request)
    
    query = request.query
    role = query.get('role')
    email = query.get('email')
    
    if role == 'customer' and email:
        await handle_customer_ws(ws, email)
    elif role == 'admin':
        await handle_admin_ws(ws)
    else:
        await ws.close(code=4000, message=b'Invalid role or email')
        
    return ws

async def index(request):
    return aiohttp.web.Response(text="Website API Server is running")

def main():
    app = aiohttp.web.Application()
    # Enable CORS
    async def cors_middleware(app, handler):
        async def middleware(request):
            if request.method == "OPTIONS":
                response = aiohttp.web.Response()
            else:
                response = await handler(request)
            
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
            return response
        return middleware
    
    app.middlewares.append(cors_middleware)
    
    app.add_routes([
        aiohttp.web.get('/', index),
        aiohttp.web.get('/ws', websocket_handler)
    ])
    aiohttp.web.run_app(app, host=HOST, port=PORT)

if __name__ == '__main__':
    main()
