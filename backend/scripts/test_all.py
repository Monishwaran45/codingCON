"""
CodingCON Backend — Full Integration Test Suite
Run with: python scripts/test_all.py
"""
import urllib.request
import urllib.error
import json
import time
import sys

BASE = "http://localhost:4000/api"
PASS = "\033[92m✓\033[0m"
FAIL = "\033[91m✗\033[0m"
WARN = "\033[93m~\033[0m"

results = []

def make_opener():
    return urllib.request.build_opener(urllib.request.HTTPCookieProcessor())

def req(opener, method, path, body=None):
    url = BASE + path
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"} if data else {}
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        resp = opener.open(r)
        return json.loads(resp.read()), resp.status
    except urllib.error.HTTPError as e:
        return json.loads(e.read()), e.code

def check(label, condition, detail=""):
    icon = PASS if condition else FAIL
    results.append((label, condition))
    print(f"  {icon}  {label}" + (f"  [{detail}]" if detail else ""))
    return condition

def section(title):
    print(f"\n{'─'*55}")
    print(f"  {title}")
    print(f"{'─'*55}")

# ─────────────────────────────────────────────────────────────
section("1. HEALTH CHECK")
# ─────────────────────────────────────────────────────────────
o = make_opener()
data, status = req(o, "GET", "/health")
check("GET /health returns 200", status == 200, f"status={status}")
check("GET /health returns ok", data.get("status") == "ok")

# ─────────────────────────────────────────────────────────────
section("2. AUTH — Register")
# ─────────────────────────────────────────────────────────────
o_new = make_opener()
ts = str(int(time.time()))
new_user_email = f"testuser_{ts}@cit.edu"
data, status = req(o_new, "POST", "/auth/register", {
    "email": new_user_email, "username": f"tester_{ts}", "password": "test1234"
})
check("POST /auth/register → 201", status == 201, f"status={status}")
check("Register returns username", "username" in data, data.get("error",""))
check("Register returns role=student", data.get("role") == "student")
new_user_id = data.get("id")

# duplicate registration
data2, status2 = req(o_new, "POST", "/auth/register", {
    "email": new_user_email, "username": f"tester_{ts}", "password": "test1234"
})
check("Duplicate register → 409", status2 == 409, f"status={status2}")

# short password
data3, status3 = req(make_opener(), "POST", "/auth/register", {
    "email": "x@cit.edu", "username": "xuser", "password": "123"
})
check("Short password → 400", status3 == 400, f"status={status3}")

# ─────────────────────────────────────────────────────────────
section("3. AUTH — Login")
# ─────────────────────────────────────────────────────────────
o_student = make_opener()
data, status = req(o_student, "POST", "/auth/login", {
    "email": "student@cit.edu", "password": "student123"
})
check("POST /auth/login → 200", status == 200, f"status={status}")
check("Login returns username", data.get("username") == "TestStudent")
check("Login returns role=student", data.get("role") == "student")
check("Login returns rating=1500", data.get("rating") == 1500)
check("Login returns ratingHistory list", isinstance(data.get("ratingHistory"), list))

# wrong password
data_bad, status_bad = req(make_opener(), "POST", "/auth/login", {
    "email": "student@cit.edu", "password": "wrongpass"
})
check("Wrong password → 401", status_bad == 401, f"status={status_bad}")

# admin login
o_admin = make_opener()
admin_data, admin_status = req(o_admin, "POST", "/auth/login", {
    "email": "admin@cit.edu", "password": "admin123"
})
check("Admin login → 200", admin_status == 200, f"status={admin_status}")
check("Admin role correct", admin_data.get("role") == "admin")

# ─────────────────────────────────────────────────────────────
section("4. AUTH — /me")
# ─────────────────────────────────────────────────────────────
data, status = req(o_student, "GET", "/auth/me")
check("GET /auth/me → 200", status == 200, f"status={status}")
check("/me returns correct user", data.get("username") == "TestStudent")

unauth_data, unauth_status = req(make_opener(), "GET", "/auth/me")
check("GET /auth/me unauthenticated → 401", unauth_status == 401)

# ─────────────────────────────────────────────────────────────
section("5. PROBLEMS — List")
# ─────────────────────────────────────────────────────────────
data, status = req(o_student, "GET", "/problems")
check("GET /problems → 200", status == 200, f"status={status}")
check("Returns 6 problems", len(data) == 6, f"got {len(data)}")
check("Problem has required fields", all(
    all(k in p for k in ["id","title","difficulty","points","tags","sampleTestCases"])
    for p in data
), "")

# filter by difficulty
data_easy, _ = req(o_student, "GET", "/problems?difficulty=easy")
check("Filter ?difficulty=easy returns 3", len(data_easy) == 3, f"got {len(data_easy)}")

data_med, _ = req(o_student, "GET", "/problems?difficulty=medium")
check("Filter ?difficulty=medium returns 2", len(data_med) == 2, f"got {len(data_med)}")

data_hard, _ = req(o_student, "GET", "/problems?difficulty=hard")
check("Filter ?difficulty=hard returns 1", len(data_hard) == 1, f"got {len(data_hard)}")

# search
data_q, _ = req(o_student, "GET", "/problems?q=sum")
check("Search ?q=sum returns 1 (Two Sum)", len(data_q) == 1, f"got {len(data_q)}")

# unauthenticated
_, unauth_status = req(make_opener(), "GET", "/problems")
check("Unauthenticated /problems → 401", unauth_status == 401)

# ─────────────────────────────────────────────────────────────
section("6. PROBLEMS — Single")
# ─────────────────────────────────────────────────────────────
all_probs, _ = req(o_student, "GET", "/problems")
two_sum = next(p for p in all_probs if p["title"] == "Two Sum")
p_id = two_sum["id"]

data, status = req(o_student, "GET", f"/problems/{p_id}")
check("GET /problems/:id → 200", status == 200, f"status={status}")
check("Problem has sampleTestCases", len(data.get("sampleTestCases", [])) >= 1)
check("Problem has description", len(data.get("description","")) > 10)
check("Problem has inputFormat", len(data.get("inputFormat","")) > 0)

# by slug
data_slug, status_slug = req(o_student, "GET", "/problems/two-sum")
check("GET /problems/two-sum (by slug) → 200", status_slug == 200)
check("Slug lookup returns same problem", data_slug.get("id") == p_id)

# 404
_, s404 = req(o_student, "GET", "/problems/nonexistent-problem")
check("GET /problems/nonexistent → 404", s404 == 404)

# ─────────────────────────────────────────────────────────────
section("7. PROBLEMS — Create (admin only)")
# ─────────────────────────────────────────────────────────────
new_prob, status = req(o_admin, "POST", "/problems", {
    "title": f"Test Problem Auto {ts}",
    "difficulty": "easy",
    "points": 50,
    "timeLimitMs": 500,
    "memoryLimitMb": 128,
    "description": "Print Hello World",
    "inputFormat": "No input",
    "outputFormat": "Hello World",
    "tags": ["Basic"],
    "sampleTestCases": [{"input": "", "expectedOutput": "Hello World", "isSample": True}]
})
check("POST /problems (admin) → 201", status == 201, f"status={status}")
check("Created problem has id", "id" in new_prob, new_prob.get("error",""))
new_prob_id = new_prob.get("id")

# student cannot create
_, status_forbidden = req(o_student, "POST", "/problems", {
    "title": "Hack Problem", "difficulty": "easy", "description": "x", "points": 10
})
check("POST /problems (student) → 403", status_forbidden == 403, f"status={status_forbidden}")

# ─────────────────────────────────────────────────────────────
section("8. PROBLEMS — Update & Delete (admin)")
# ─────────────────────────────────────────────────────────────
if new_prob_id:
    patched, status = req(o_admin, "PATCH", f"/problems/{new_prob_id}", {"points": 75})
    check("PATCH /problems/:id → 200", status == 200, f"status={status}")
    check("Points updated to 75", patched.get("points") == 75, f"got {patched.get('points')}")

    _, del_status = req(o_admin, "DELETE", f"/problems/{new_prob_id}")
    check("DELETE /problems/:id → 200", del_status == 200, f"status={del_status}")

    _, after_del = req(o_student, "GET", f"/problems/{new_prob_id}")
    check("Deleted problem returns 404", after_del == 404, f"status={after_del}")

# ─────────────────────────────────────────────────────────────
section("9. CONTESTS")
# ─────────────────────────────────────────────────────────────
data, status = req(o_student, "GET", "/contest/active")
check("GET /contest/active → 200", status == 200, f"status={status}")
check("Contest has title", len(data.get("title","")) > 0)
check("Contest has 4 problems", len(data.get("problems",[])) == 4, f"got {len(data.get('problems',[]))}")
check("Contest has 2+ announcements", len(data.get("announcements",[])) >= 2, f"got {len(data.get('announcements',[]))}")
check("Contest has startTime", "startTime" in data)
check("Contest has endTime", "endTime" in data)
contest_id = data.get("id")

data_by_id, status_id = req(o_student, "GET", f"/contest/{contest_id}")
check("GET /contest/:id → 200", status_id == 200, f"status={status_id}")
check("Participant count >= 1", data_by_id.get("participantCount", 0) >= 1,
      f"count={data_by_id.get('participantCount')}")

_, s404 = req(o_student, "GET", "/contest/fake-contest-xyz")
check("GET /contest/unknown → 404", s404 == 404)

# ─────────────────────────────────────────────────────────────
section("10. ANNOUNCEMENTS")
# ─────────────────────────────────────────────────────────────
ann, status = req(o_admin, "POST", f"/contest/{contest_id}/announcements", {
    "message": "Test announcement from integration test"
})
check("POST /contest/:id/announcements (admin) → 201", status == 201, f"status={status}")
check("Announcement has id and message", "id" in ann and "message" in ann)

_, s403 = req(o_student, "POST", f"/contest/{contest_id}/announcements", {"message": "hack"})
check("Announcement by student → 403", s403 == 403, f"status={s403}")

# ─────────────────────────────────────────────────────────────
section("11. LEADERBOARD")
# ─────────────────────────────────────────────────────────────
lb, status = req(o_student, "GET", f"/leaderboard/{contest_id}")
check("GET /leaderboard/:id → 200", status == 200, f"status={status}")
check("Leaderboard is a list", isinstance(lb, list))
check("Leaderboard entries have rank", all("rank" in e for e in lb) if lb else True)
check("Leaderboard entries have username", all("username" in e for e in lb) if lb else True)

# ─────────────────────────────────────────────────────────────
section("12. PROFILE")
# ─────────────────────────────────────────────────────────────
profile, status = req(o_student, "GET", "/profile")
check("GET /profile → 200", status == 200, f"status={status}")
check("Profile has username", profile.get("username") == "TestStudent")
check("Profile has rating", isinstance(profile.get("rating"), int))
check("Profile has solvedCount", isinstance(profile.get("solvedCount"), int))
check("Profile has ratingHistory", isinstance(profile.get("ratingHistory"), list))

# ─────────────────────────────────────────────────────────────
section("13. SUBMISSIONS — List (empty initially)")
# ─────────────────────────────────────────────────────────────
subs, status = req(o_student, "GET", "/submissions")
check("GET /submissions → 200", status == 200, f"status={status}")
check("Submissions is a list", isinstance(subs, list))

# ─────────────────────────────────────────────────────────────
section("14. JUDGE — Python AC (Two Sum)")
# ─────────────────────────────────────────────────────────────
code_ac = """
n = int(input())
nums = list(map(int, input().split()))
target = int(input())
seen = {}
for i, v in enumerate(nums):
    if target - v in seen:
        print(seen[target - v], i)
        break
    seen[v] = i
""".strip()

sub_resp, status = req(o_student, "POST", "/submissions", {
    "problemId": p_id, "language": "python", "code": code_ac, "isSubmit": True, "contestId": contest_id
})
check("POST /submissions → 202", status == 202, f"status={status}")
check("Response has submission id", "id" in sub_resp)
check("Response has totalTestCases=5", sub_resp.get("totalTestCases") == 5, f"got {sub_resp.get('totalTestCases')}")
sub_id_ac = sub_resp.get("id")

print("    [waiting for judge…]")
time.sleep(6)

result, status = req(o_student, "GET", f"/submissions/{sub_id_ac}")
check("GET /submissions/:id → 200", status == 200, f"status={status}")
check("Python Two Sum → AC", result.get("verdict") == "AC", f"verdict={result.get('verdict')}")
check("All 5 test cases passed", result.get("passedTestCases") == 5, f"passed={result.get('passedTestCases')}")
check("executionTimeMs recorded", result.get("executionTimeMs", 0) > 0)
check("testCaseResults has 5 entries", len(result.get("testCaseResults",[])) == 5)

# ─────────────────────────────────────────────────────────────
section("15. JUDGE — Wrong Answer")
# ─────────────────────────────────────────────────────────────
# Simple wrong answer — outputs 999 instead of the correct indices
code_wa = "print(999)"

sub_wa, status = req(o_student, "POST", "/submissions", {
    "problemId": p_id, "language": "python", "code": code_wa, "isSubmit": True
})
sub_id_wa = sub_wa.get("id")
print("    [waiting for judge…]")
time.sleep(6)

result_wa, _ = req(o_student, "GET", f"/submissions/{sub_id_wa}")
check("Wrong answer → WA verdict", result_wa.get("verdict") == "WA", f"verdict={result_wa.get('verdict')}")
check("WA: 0 test cases passed", result_wa.get("passedTestCases") == 0, f"passed={result_wa.get('passedTestCases')}")

# ─────────────────────────────────────────────────────────────
section("16. JUDGE — Runtime Error")
# ─────────────────────────────────────────────────────────────
code_re = "raise RuntimeError('boom')"

sub_re, _ = req(o_student, "POST", "/submissions", {
    "problemId": p_id, "language": "python", "code": code_re, "isSubmit": False
})
sub_id_re = sub_re.get("id")
time.sleep(4)

result_re, _ = req(o_student, "GET", f"/submissions/{sub_id_re}")
check("Runtime error → RE verdict", result_re.get("verdict") == "RE", f"verdict={result_re.get('verdict')}")

# ─────────────────────────────────────────────────────────────
section("17. JUDGE — JavaScript AC (Binary Search)")
# ─────────────────────────────────────────────────────────────
bs_prob = next(p for p in all_probs if p["title"] == "Binary Search")

code_js = """let buf = "";
process.stdin.on("data", d => { buf += d; });
process.stdin.on("end", () => {
  const lines = buf.trim().split("\\n");
  const nums = lines[1].trim().split(" ").map(Number);
  const target = parseInt(lines[2]);
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] === target) { console.log(mid); process.exit(0); }
    else if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  console.log(-1);
  process.exit(0);
});"""

sub_js, status_js = req(o_student, "POST", "/submissions", {
    "problemId": bs_prob["id"], "language": "javascript", "code": code_js, "isSubmit": True
})
print("    [waiting for judge…]")
time.sleep(15)

result_js, _ = req(o_student, "GET", f"/submissions/{sub_js.get('id')}")
check("JavaScript Binary Search → AC", result_js.get("verdict") == "AC", f"verdict={result_js.get('verdict')}")
check("JS: all test cases passed", result_js.get("passedTestCases") == result_js.get("totalTestCases"),
      f"{result_js.get('passedTestCases')}/{result_js.get('totalTestCases')}")

# ─────────────────────────────────────────────────────────────
section("18. JUDGE — Run mode (sample cases only)")
# ─────────────────────────────────────────────────────────────
sub_run, status_run = req(o_student, "POST", "/submissions", {
    "problemId": p_id, "language": "python", "code": code_ac, "isSubmit": False
})
check("POST /submissions (isSubmit=false) → 202", status_run == 202)
sub_id_run = sub_run.get("id")
time.sleep(4)

result_run, _ = req(o_student, "GET", f"/submissions/{sub_id_run}")
check("Run mode uses sample cases only (2)", result_run.get("totalTestCases") == 2,
      f"got {result_run.get('totalTestCases')}")
check("Run mode: AC on samples", result_run.get("verdict") == "AC",
      f"verdict={result_run.get('verdict')}")

# ─────────────────────────────────────────────────────────────
section("19. LEADERBOARD — Updated after AC submit")
# ─────────────────────────────────────────────────────────────
lb2, _ = req(o_student, "GET", f"/leaderboard/{contest_id}")
student_entry = next((e for e in lb2 if e.get("username") == "TestStudent"), None)
check("Student appears on leaderboard", student_entry is not None)
if student_entry:
    check("Student has totalScore > 0", student_entry.get("totalScore", 0) > 0,
          f"score={student_entry.get('totalScore')}")
    check("Student has solvedCount >= 1", student_entry.get("solvedCount", 0) >= 1,
          f"solved={student_entry.get('solvedCount')}")

# ─────────────────────────────────────────────────────────────
section("20. SUBMISSIONS HISTORY")
# ─────────────────────────────────────────────────────────────
all_subs, _ = req(o_student, "GET", "/submissions")
check("Submissions list has entries now", len(all_subs) >= 4, f"got {len(all_subs)}")
check("Each sub has problemTitle", all("problemTitle" in s for s in all_subs))
check("Each sub has verdict", all("verdict" in s for s in all_subs))

# ─────────────────────────────────────────────────────────────
section("21. AUTH — Logout")
# ─────────────────────────────────────────────────────────────
out_data, out_status = req(o_student, "POST", "/auth/logout")
check("POST /auth/logout → 200", out_status == 200, f"status={out_status}")

after_logout, status_after = req(o_student, "GET", "/auth/me")
check("After logout /auth/me → 401", status_after == 401, f"status={status_after}")

# ─────────────────────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────────────────────
print(f"\n{'═'*55}")
total  = len(results)
passed = sum(1 for _, ok in results if ok)
failed = total - passed
print(f"  Results: {passed}/{total} passed", end="")
if failed:
    print(f"  ({failed} failed)")
    print("\n  Failed tests:")
    for label, ok in results:
        if not ok:
            print(f"    {FAIL} {label}")
else:
    print("  — all green ✓")
print(f"{'═'*55}\n")

sys.exit(0 if failed == 0 else 1)
