from typing import Any, Dict, List

from google.adk.tools.tool_context import ToolContext


def get_session_state(tool_context: ToolContext, columns: List[str]) -> Dict[str, Any]:
    """
    Retrieve multiple specified values from the tool context session state.

    Args:
        tool_context: The context object containing the state dictionary.
        columns: A list of string keys (column names) to retrieve from the state.

    Returns:
        A dictionary containing the requested keys and their corresponding values.
        If a key is not found in the state, its value will be None.
    """
    state = tool_context.state
    retrieved_data = {}

    for key in columns:
        retrieved_data[key] = state.get(key)

    return retrieved_data


def append_session_state(
    tool_context: ToolContext, column: str, datas: List[Any]
) -> None:
    """Append items to a state column, initializing it if necessary."""

    current_value = tool_context.state.get(column)

    if current_value is None or not isinstance(current_value, list):
        current_value = []

    current_value += datas

    tool_context.state[column] = current_value


def update_session_state(tool_context: ToolContext, data: Dict[str, Any]) -> None:
    """Changes multiple state column key with value in one go."""
    state = tool_context.state

    for key, value in data.items():
        state[key] = value
    return True


def reset_context_state(tool_context: ToolContext, columns: List[str]) -> None:
    """Reset the specified state columns to None."""
    for column in columns:
        tool_context.state[column] = None

    return True

def initialize_context_states(
    state: Dict[str, Any], with_memory: bool = False
):
    state["agent_initialized"] = None
    state["test"] = "yep"
