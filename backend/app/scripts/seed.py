import uuid
import asyncio
import bcrypt
from datetime import datetime, timedelta

from app.db import init_db
from app.models.user import User
from app.models.problem import Problem, TestCase
from app.models.contest import Contest
from app.models.announcement import Announcement

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def seed():
    print("[Seed] Initializing DB connection...")
    await init_db()

    count = await User.count()
    if count > 0:
        print("[Seed] Database already populated, skipping seed.")
        return

    print("[Seed] Seeding Users...")
    admin_id = str(uuid.uuid4())
    faculty_id = str(uuid.uuid4())
    student_id = str(uuid.uuid4())

    await User(
        id=admin_id,
        username="Admin",
        email="admin@cit.edu",
        password_hash=hash_password("admin123"),
        role="admin",
        rating=0
    ).save()

    await User(
        id=faculty_id,
        username="Faculty",
        email="faculty@cit.edu",
        password_hash=hash_password("faculty123"),
        role="problem_setter",
        rating=0
    ).save()

    await User(
        id=student_id,
        username="TestStudent",
        email="student@cit.edu",
        password_hash=hash_password("student123"),
        role="student",
        rating=1500
    ).save()

    print("[Seed] Seeding Problems...")
    p1_id = str(uuid.uuid4())
    p2_id = str(uuid.uuid4())
    p3_id = str(uuid.uuid4())
    p4_id = str(uuid.uuid4())

    await Problem(
        id=p1_id,
        title="Two Sum",
        slug="two-sum",
        difficulty="easy",
        points=100,
        time_limit_ms=1000,
        memory_limit_mb=256,
        description="Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
        input_format="First line: integer N\nSecond line: N space-separated integers\nThird line: integer target",
        output_format="Two space-separated indices i and j (0-indexed) such that nums[i]+nums[j]==target",
        tags=["Arrays", "Hash Map"],
        created_by=admin_id,
        test_cases=[
            TestCase(id=str(uuid.uuid4()), input="4\n2 7 11 15\n9", expected_output="0 1", is_sample=True, sort_order=0),
            TestCase(id=str(uuid.uuid4()), input="3\n3 2 4\n6", expected_output="1 2", is_sample=True, sort_order=1),
            TestCase(id=str(uuid.uuid4()), input="2\n3 3\n6", expected_output="0 1", is_sample=False, sort_order=2),
        ]
    ).save()

    await Problem(
        id=p2_id,
        title="Valid Parentheses",
        slug="valid-parentheses",
        difficulty="easy",
        points=100,
        time_limit_ms=1000,
        memory_limit_mb=256,
        description="Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.",
        input_format="A single line string s",
        output_format='Print "true" if valid, "false" otherwise',
        tags=["Strings", "Stack"],
        created_by=admin_id,
        test_cases=[
            TestCase(id=str(uuid.uuid4()), input="()", expected_output="true", is_sample=True, sort_order=0),
            TestCase(id=str(uuid.uuid4()), input="(]", expected_output="false", is_sample=True, sort_order=1),
        ]
    ).save()

    await Problem(
        id=p3_id,
        title="Binary Search",
        slug="binary-search",
        difficulty="easy",
        points=100,
        time_limit_ms=2000,
        memory_limit_mb=256,
        description="Given a sorted array of integers `nums` and a target integer, return the index of target. If not found, return -1.",
        input_format="First line: N\nSecond line: N sorted integers\nThird line: target",
        output_format="Index of target",
        tags=["Arrays", "Searching"],
        created_by=admin_id,
        test_cases=[
            TestCase(id=str(uuid.uuid4()), input="6\n-1 0 3 5 9 12\n9", expected_output="4", is_sample=True, sort_order=0),
        ]
    ).save()

    await Problem(
        id=p4_id,
        title="Maximum Subarray",
        slug="maximum-subarray",
        difficulty="medium",
        points=200,
        time_limit_ms=1000,
        memory_limit_mb=256,
        description="Given an integer array `nums`, find the contiguous subarray with the largest sum and return its sum.",
        input_format="First line: N\nSecond line: N space-separated integers",
        output_format="Integer — maximum subarray sum",
        tags=["Arrays", "Dynamic Programming"],
        created_by=admin_id,
        test_cases=[
            TestCase(id=str(uuid.uuid4()), input="9\n-2 1 -3 4 -1 2 1 -5 4", expected_output="6", is_sample=True, sort_order=0),
        ]
    ).save()

    print("[Seed] Seeding Contest...")
    now = datetime.utcnow()
    c_id = "c88"

    await Contest(
        id=c_id,
        title="CIT Coding Assessment - Session 1",
        start_time=now - timedelta(minutes=30),
        end_time=now + timedelta(minutes=90),
        duration_minutes=120,
        max_score=500,
        created_by=admin_id,
        problem_ids=[p1_id, p2_id, p3_id, p4_id]
    ).save()

    await Announcement(
        id=str(uuid.uuid4()),
        contest_id=c_id,
        message="Welcome to Session 1. You have 120 minutes. Good luck to all participants.",
        timestamp=now - timedelta(minutes=20)
    ).save()

    print("[Seed] Seeding finished successfully!")

if __name__ == "__main__":
    asyncio.run(seed())
