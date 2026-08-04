import urllib.request, json, time

BASE = "http://localhost:4000/api"
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor())

def post(path, body):
    r = urllib.request.Request(BASE+path, json.dumps(body).encode(), {"Content-Type":"application/json"})
    try:
        return json.loads(opener.open(r).read()), 200
    except urllib.error.HTTPError as e:
        return json.loads(e.read()), e.code

import urllib.error
post("/auth/login", {"email":"student@cit.edu","password":"student123"})

probs = json.loads(opener.open(BASE+"/problems").read())
two_sum = next(p for p in probs if p["title"]=="Two Sum")
bs      = next(p for p in probs if p["title"]=="Binary Search")

print(f"Two Sum  timeLimitMs = {two_sum['timeLimitMs']}")
print(f"BinSearch timeLimitMs = {bs['timeLimitMs']}")

def submit(prob_id, lang, code, is_submit=True):
    r = urllib.request.Request(
        BASE+"/submissions",
        json.dumps({"problemId":prob_id,"language":lang,"code":code,"isSubmit":is_submit}).encode(),
        {"Content-Type":"application/json"})
    return json.loads(opener.open(r).read())

def get_sub(sub_id):
    return json.loads(opener.open(BASE+"/submissions/"+sub_id).read())

# --- WA: print wrong output
print("\n--- WA test ---")
s = submit(two_sum["id"], "python", "print(999)")
time.sleep(6)
r = get_sub(s["id"])
print(f"verdict={r['verdict']}  time={r['executionTimeMs']}ms  passed={r['passedTestCases']}/{r['totalTestCases']}")
if r.get("testCaseResults"):
    tc = r["testCaseResults"][0]
    print(f"  tc0: passed={tc['passed']}  actual={repr(tc['actualOutput'])}  err={repr(tc.get('error'))}")

# --- JS binary search
print("\n--- JS Binary Search ---")
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

s2 = submit(bs["id"], "javascript", code_js)
print(f"submitted: id={s2['id']} total={s2['totalTestCases']}")
time.sleep(12)
r2 = get_sub(s2["id"])
print(f"verdict={r2['verdict']}  time={r2['executionTimeMs']}ms  passed={r2['passedTestCases']}/{r2['totalTestCases']}")
if r2.get("testCaseResults"):
    for i,tc in enumerate(r2["testCaseResults"][:2]):
        print(f"  tc{i}: passed={tc['passed']}  actual={repr(tc['actualOutput'])}  err={repr(tc.get('error'))}  time={tc['executionTimeMs']}ms")
