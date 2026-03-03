import streamlit as st
import requests
import json
import uuid
import time

# Set page config
st.set_page_config(
    page_title="ADK Agent Portal",
    layout="centered"
)

# Constants
API_BASE_URL = "http://localhost:8000"
APP_NAME = "ai_agents"

# Initialize session state variables
if "user_id" not in st.session_state:
    st.session_state.user_id = f"user-{uuid.uuid4()}"
    
if "session_id" not in st.session_state:
    st.session_state.session_id = None
    
if "messages" not in st.session_state:
    st.session_state.messages = []

def create_session():
    """Initializes a new stateful session on the ADK server."""
    session_id = f"session-{int(time.time())}"
    response = requests.post(
        f"{API_BASE_URL}/apps/{APP_NAME}/users/{st.session_state.user_id}/sessions/{session_id}",
        headers={"Content-Type": "application/json"},
        data=json.dumps({})
    )
    
    if response.status_code == 200:
        st.session_state.session_id = session_id
        st.session_state.messages = []
        return True
    else:
        st.error(f"Failed to create session: {response.text}")
        return False

def send_message(message):
    """Sends user text and handles the generic event stream response."""
    if not st.session_state.session_id:
        st.error("No active session.")
        return False
    
    # Add user message to history
    st.session_state.messages.append({"role": "user", "content": message})
    
    # API Request
    response = requests.post(
        f"{API_BASE_URL}/run",
        headers={"Content-Type": "application/json"},
        data=json.dumps({
            "app_name": APP_NAME,
            "user_id": st.session_state.user_id,
            "session_id": st.session_state.session_id,
            "new_message": {
                "role": "user",
                "parts": [{"text": message}]
            }
        })
    )
    
    if response.status_code != 200:
        st.error(f"Error: {response.text}")
        return False
    
    events = response.json()
    assistant_text = ""
    
    # Generic Event Processing
    for event in events:
        # Capture model text content
        if "content" in event:
            parts = event["content"].get("parts", [])
            if parts and "text" in parts[0]:
                assistant_text += parts[0]["text"]
        
        # Log thoughts to console/terminal for debugging
        if "thought" in event:
            print(f"Agent Thought: {event['thought']}")
    
    if assistant_text:
        st.session_state.messages.append({"role": "assistant", "content": assistant_text})
    
    return True

# --- UI Components ---
st.title("🤖 Generic Agent Portal")

with st.sidebar:
    st.header("Session Control")
    
    if st.session_state.session_id:
        st.success(f"ID: {st.session_state.session_id}")
        if st.button("🗑️ Reset Chat"):
            st.session_state.session_id = None
            st.session_state.messages = []
            st.rerun()
    else:
        if st.button("🚀 Start New Session", use_container_width=True):
            create_session()
            st.rerun()
    
    st.divider()
    # Improved Session State Monitor
    with st.expander("🔍 Monitor State", expanded=False):
        # Shows everything except the message history to keep it readable
        display_state = {k: v for k, v in st.session_state.items() if k != 'messages'}
        st.json(display_state)
        st.caption(f"Total Messages: {len(st.session_state.messages)}")

# Chat Display
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

# User Input
if sess_id := st.session_state.get("session_id"):
    # 2. Now you can use sess_id safely
    if prompt := st.chat_input("Enter command..."):
        send_message(prompt)
        st.rerun()
else:
    st.info("Please initialize a session in the sidebar to begin.")