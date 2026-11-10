from copy import deepcopy

import pytest
from fastapi.testclient import TestClient

from src.app import activities, app


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def restore_activities():
    original_activities = deepcopy(activities)
    try:
        yield
    finally:
        activities.clear()
        activities.update(original_activities)


def test_get_activities_returns_all_activities(client):
    # Arrange
    expected_activities = deepcopy(activities)

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    assert response.json() == expected_activities


def test_signup_adds_student_to_activity(client):
    # Arrange
    activity_name = "Basketball Team"
    email = "new.student@mergington.edu"
    activities[activity_name]["participants"] = ["existing.student@mergington.edu"]

    # Act
    response = client.post(
        f"/activities/{activity_name}/signup",
        params={"email": email},
    )

    # Assert
    assert response.status_code == 200
    assert response.json() == {"message": f"Signed up {email} for {activity_name}"}
    assert activities[activity_name]["participants"] == [
        "existing.student@mergington.edu",
        email,
    ]


def test_signup_rejects_duplicate_student(client):
    # Arrange
    activity_name = "Basketball Team"
    email = "student@mergington.edu"
    activities[activity_name]["participants"] = [email]

    # Act
    response = client.post(
        f"/activities/{activity_name}/signup",
        params={"email": email},
    )

    # Assert
    assert response.status_code == 400
    assert response.json() == {
        "detail": "Student is already signed up for this activity"
    }
    assert activities[activity_name]["participants"] == [email]


def test_signup_rejects_unknown_activity(client):
    # Arrange
    activity_name = "Unknown Activity"
    email = "student@mergington.edu"

    # Act
    response = client.post(
        f"/activities/{activity_name}/signup",
        params={"email": email},
    )

    # Assert
    assert response.status_code == 404
    assert response.json() == {"detail": "Activity not found"}


def test_remove_participant_removes_all_matching_entries(client):
    # Arrange
    activity_name = "Basketball Team"
    email = "student@mergington.edu"
    remaining_email = "remaining.student@mergington.edu"
    activities[activity_name]["participants"] = [email, remaining_email, email]

    # Act
    response = client.delete(
        f"/activities/{activity_name}/participants",
        params={"email": email},
    )

    # Assert
    assert response.status_code == 200
    assert response.json() == {"message": f"Removed {email} from {activity_name}"}
    assert activities[activity_name]["participants"] == [remaining_email]


def test_remove_participant_rejects_unregistered_student(client):
    # Arrange
    activity_name = "Basketball Team"
    email = "unregistered.student@mergington.edu"

    # Act
    response = client.delete(
        f"/activities/{activity_name}/participants",
        params={"email": email},
    )

    # Assert
    assert response.status_code == 404
    assert response.json() == {
        "detail": "Student is not signed up for this activity"
    }


def test_remove_participant_rejects_unknown_activity(client):
    # Arrange
    activity_name = "Unknown Activity"
    email = "student@mergington.edu"

    # Act
    response = client.delete(
        f"/activities/{activity_name}/participants",
        params={"email": email},
    )

    # Assert
    assert response.status_code == 404
    assert response.json() == {"detail": "Activity not found"}