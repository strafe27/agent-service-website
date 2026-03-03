import datetime

from dateutil.relativedelta import relativedelta


def get_current_datetime() -> dict:
    """
    Returns the current date and time formatted as a string.

    Returns:
        A dictionary with a 'status' key and the current datetime string.
    """
    current_datetime = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return {"status": "success", "current_datetime": current_datetime}


def validate_date(date_string: str) -> dict:
    """
    Checks if a string represents a valid, real-world date in YYYY-MM-DD format.

    Args:
        date_string: The string to validate.

    Returns:
        A dictionary with a 'status', 'is_valid' boolean, and 'message'.
    """
    try:
        datetime.datetime.strptime(date_string, "%Y-%m-%d")
        return {"status": "success", "is_valid": True, "message": "Date is valid."}
    except ValueError:
        return {
            "status": "error",
            "is_valid": False,
            "message": "Invalid date format. Please use YYYY-MM-DD.",
        }


def get_relative_date(value: int, unit: str) -> dict:
    """
    Calculates a date in the past relative to the current date.

    Args:
        value: The integer value for the time period (e.g., 1, 2, 3).
        unit: The unit of time (e.g., 'day', 'week', 'month', 'year').

    Returns:
        A dictionary with the calculated date string or an error message.
    """
    now = datetime.datetime.now()
    unit_lower = unit.lower()

    if unit_lower == "day":
        delta = datetime.timedelta(days=-value)
    elif unit_lower == "week":
        delta = datetime.timedelta(weeks=-value)
    elif unit_lower == "month":
        delta = relativedelta(months=-value)
    elif unit_lower == "year":
        delta = relativedelta(years=-value)
    else:
        return {
            "status": "error",
            "error_message": "Invalid time unit. Please use 'day', 'week', 'month', or 'year'.",
        }

    relative_datetime = now + delta
    return {
        "status": "success",
        "relative_date": relative_datetime.strftime("%Y-%m-%d"),
    }
