import os

from dotenv import load_dotenv
from google.adk.agents.callback_context import CallbackContext
from google.adk.agents.llm_agent import Agent

from ..tools import date_tools, state_tools

load_dotenv()
MODEL_NAME = os.environ.get("GOOGLE_GENAI_MODEL", "gemini-2.5-flash")

current_dir = os.path.dirname(os.path.abspath(__file__))

md_path = os.path.join(current_dir, "sub_agent_instruction.md")
with open(md_path, "r", encoding="utf-8") as f:
    instructions = f.read()

def before_agent_callback(callback_context: CallbackContext):
    state = callback_context.state
    if not state.get("agent_initialized"):
        state_tools.initialize_context_states(state)
        state["agent_initialized"] = True
    return None


sub_agent = Agent(
    model=MODEL_NAME,
    name="sub_agent",
    description="Sub Agent Specialized in being a sub agent",
    instruction=instructions,
    tools=[
        state_tools.get_session_state,
        state_tools.append_session_state,
        state_tools.update_session_state,
        date_tools.validate_date,
        date_tools.get_current_datetime,
        date_tools.get_relative_date,
    ],
    before_agent_callback=before_agent_callback,
)
