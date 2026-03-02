import asyncio
import os
import json
import uuid
from datetime import datetime
import aiohttp.web
from aiohttp import WSMessage, WSMsgType

HOST = os.getenv('HOST', '0.0.0.0')
PORT = int(os.getenv('PORT', 8081))

# Global state to keep track of connections and chats
# In a real app, this would be in a database (e.g., Redis)
active_chats = {} # chat_id -> chat_info
customer_connections = {} # customer_email -> ws
admin_connections = set() # set of admin ws

async def handle_customer_ws(ws, email):
    customer_connections[email] = ws
    try:
        async for msg in ws:
            if msg.type == WSMsgType.TEXT:
                data = json.loads(msg.data)
                action = data.get('action')
                
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
                
                if action == 'send_message':
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
