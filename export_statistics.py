#!/usr/bin/env python3
"""
ETEX Quiz Game - Statistics Exporter
===================================
Fetches participation data, quiz results, question accuracy, and lottery eligibility
from PostgreSQL and exports it into a structured JSON file for the standalone
statistics HTML dashboard.

Usage:
    python export_statistics.py
    python export_statistics.py --db-url "postgresql://postgres:password@localhost:5432/etex_game"
    python export_statistics.py --password "your_postgres_password"
    python export_statistics.py --demo   # Generates sample data without database
"""

import os
import sys
import json
import argparse
from datetime import datetime, timezone, timedelta

# Fix Windows console UTF-8 printing
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def parse_args():
    parser = argparse.ArgumentParser(description="Export ETEX quiz statistics from PostgreSQL to JSON")
    parser.add_argument(
        "--db-url",
        default=os.environ.get("DATABASE_URL"),
        help="PostgreSQL connection URL (e.g. postgresql://user:password@localhost:5432/etex_game)"
    )
    parser.add_argument("--host", default=os.environ.get("PGHOST", "127.0.0.1"), help="Database host")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PGPORT", 5432)), help="Database port")
    parser.add_argument("--user", default=os.environ.get("PGUSER", "postgres"), help="Database user")
    parser.add_argument("--password", default=os.environ.get("PGPASSWORD"), help="Database password")
    parser.add_argument("--dbname", default=os.environ.get("PGDATABASE", "etex_game"), help="Database name")
    parser.add_argument(
        "--output",
        default="statistics_data.json",
        help="Primary output JSON filepath (default: statistics_data.json)"
    )
    parser.add_argument(
        "--copy-to-public",
        action="store_true",
        default=True,
        help="Also write a copy to public/statistics_data.json if public directory exists"
    )
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Generate high-fidelity sample statistics without connecting to PostgreSQL"
    )
    return parser.parse_args()


def load_env_db_url():
    """Attempt to read DATABASE_URL from backend/.env if available."""
    backend_env_path = os.path.join(os.path.dirname(__file__), "backend", ".env")
    if os.path.exists(backend_env_path):
        try:
            with open(backend_env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("DATABASE_URL="):
                        val = line.split("=", 1)[1].strip().strip('"').strip("'")
                        return val
        except Exception:
            pass
    return None


def generate_sample_data():
    """Generate realistic demonstration statistics for initial preview."""
    now = datetime.now(timezone.utc)
    dates = [(now - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(13, -1, -1)]
    
    questions = [
        {
            "id": 1,
            "question": "What does INSA stand for?",
            "isActive": True,
            "totalAnswers": 412,
            "correctAnswers": 358,
            "incorrectAnswers": 54,
            "accuracyRate": 86.9,
            "difficulty": "Easy"
        },
        {
            "id": 2,
            "question": "What is the most common type of cyber attack?",
            "isActive": True,
            "totalAnswers": 408,
            "correctAnswers": 342,
            "incorrectAnswers": 66,
            "accuracyRate": 83.8,
            "difficulty": "Easy"
        },
        {
            "id": 3,
            "question": "Which protocol is used for secure communication over a computer network?",
            "isActive": True,
            "totalAnswers": 405,
            "correctAnswers": 371,
            "incorrectAnswers": 34,
            "accuracyRate": 91.6,
            "difficulty": "Easy"
        },
        {
            "id": 4,
            "question": "What is a strong password?",
            "isActive": True,
            "totalAnswers": 401,
            "correctAnswers": 385,
            "incorrectAnswers": 16,
            "accuracyRate": 96.0,
            "difficulty": "Easy"
        },
        {
            "id": 5,
            "question": "What should you do if you receive a suspicious email?",
            "isActive": True,
            "totalAnswers": 398,
            "correctAnswers": 366,
            "incorrectAnswers": 32,
            "accuracyRate": 92.0,
            "difficulty": "Easy"
        },
        {
            "id": 6,
            "question": "What is Two-Factor Authentication (2FA)?",
            "isActive": True,
            "totalAnswers": 390,
            "correctAnswers": 308,
            "incorrectAnswers": 82,
            "accuracyRate": 79.0,
            "difficulty": "Moderate"
        },
        {
            "id": 7,
            "question": "What type of malware encrypts your files and demands money for decryption?",
            "isActive": True,
            "totalAnswers": 384,
            "correctAnswers": 296,
            "incorrectAnswers": 88,
            "accuracyRate": 77.1,
            "difficulty": "Moderate"
        },
        {
            "id": 8,
            "question": "Which of the following is considered a social engineering technique?",
            "isActive": True,
            "totalAnswers": 379,
            "correctAnswers": 242,
            "incorrectAnswers": 137,
            "accuracyRate": 63.9,
            "difficulty": "Moderate"
        },
        {
            "id": 9,
            "question": "What does a VPN (Virtual Private Network) do?",
            "isActive": True,
            "totalAnswers": 372,
            "correctAnswers": 289,
            "incorrectAnswers": 83,
            "accuracyRate": 77.7,
            "difficulty": "Moderate"
        },
        {
            "id": 10,
            "question": "What is the primary purpose of a firewall in network security?",
            "isActive": True,
            "totalAnswers": 365,
            "correctAnswers": 221,
            "incorrectAnswers": 144,
            "accuracyRate": 60.5,
            "difficulty": "Challenging"
        }
    ]

    daily_trend = [
        {"date": dates[0], "attempts": 18, "eligible": 12, "uniqueParticipants": 15},
        {"date": dates[1], "attempts": 24, "eligible": 16, "uniqueParticipants": 21},
        {"date": dates[2], "attempts": 31, "eligible": 20, "uniqueParticipants": 27},
        {"date": dates[3], "attempts": 28, "eligible": 19, "uniqueParticipants": 25},
        {"date": dates[4], "attempts": 35, "eligible": 24, "uniqueParticipants": 30},
        {"date": dates[5], "attempts": 42, "eligible": 31, "uniqueParticipants": 38},
        {"date": dates[6], "attempts": 39, "eligible": 28, "uniqueParticipants": 34},
        {"date": dates[7], "attempts": 45, "eligible": 33, "uniqueParticipants": 39},
        {"date": dates[8], "attempts": 52, "eligible": 39, "uniqueParticipants": 46},
        {"date": dates[9], "attempts": 48, "eligible": 35, "uniqueParticipants": 41},
        {"date": dates[10], "attempts": 58, "eligible": 43, "uniqueParticipants": 51},
        {"date": dates[11], "attempts": 64, "eligible": 49, "uniqueParticipants": 55},
        {"date": dates[12], "attempts": 71, "eligible": 56, "uniqueParticipants": 62},
        {"date": dates[13], "attempts": 65, "eligible": 51, "uniqueParticipants": 57},
    ]

    score_distribution = {
        "0": 4,
        "1": 8,
        "2": 11,
        "3": 19,
        "4": 32,
        "5": 48,
        "6": 62,
        "7": 89,
        "8": 114,
        "9": 136,
        "10": 97
    }

    total_answers = sum(q["totalAnswers"] for q in questions)
    correct_answers = sum(q["correctAnswers"] for q in questions)

    return {
        "meta": {
            "title": "ETEX Quiz Game Participation & Performance Report",
            "exportedAt": now.isoformat(),
            "exportedAtFormatted": now.strftime("%b %d, %Y - %I:%M %p UTC"),
            "source": "Sample / Preloaded Data (Run export_statistics.py with DB connection to refresh live)",
            "version": "1.0"
        },
        "summary": {
            "totalParticipants": 450,
            "totalSessions": 620,
            "completedSessions": 620,
            "eligibleParticipants": 346,
            "ineligibleParticipants": 104,
            "eligibilityRate": 76.9,
            "eligibilityThreshold": 7,
            "averageScore": 7.8,
            "totalQuestions": len(questions),
            "totalAnswers": total_answers,
            "correctAnswers": correct_answers,
            "incorrectAnswers": total_answers - correct_answers,
            "overallAccuracyRate": round((correct_answers / total_answers) * 100, 1),
            "miniLotteryWinners": 12,
            "grandLotteryWinners": 3
        },
        "scoreDistribution": score_distribution,
        "eligibilityBreakdown": {
            "eligible": 346,
            "notEligible": 104,
            "threshold": 7
        },
        "accuracyBreakdown": {
            "correct": correct_answers,
            "incorrect": total_answers - correct_answers
        },
        "questionStats": questions,
        "dailyTrend": daily_trend,
        "regionalParticipation": [
            {"region": "Addis Ababa", "count": 218},
            {"region": "Oromia", "count": 86},
            {"region": "Amhara", "count": 64},
            {"region": "Sidama", "count": 32},
            {"region": "Dire Dawa", "count": 27},
            {"region": "Other / International", "count": 23}
        ]
    }


def fetch_from_database(args):
    """Connect to PostgreSQL and query all relevant participation data."""
    try:
        import psycopg2
        import psycopg2.extras
    except ImportError:
        print("ERROR: psycopg2 is not installed. Please install it using: pip install psycopg2-binary")
        sys.exit(1)

    # Determine connection string or credentials
    db_url = args.db_url or load_env_db_url()
    
    # Strip Prisma-specific query parameters like ?schema=public which psycopg2 rejects
    if db_url and "?" in db_url:
        import urllib.parse
        parsed = urllib.parse.urlparse(db_url)
        # Keep valid libpq parameters or strip Prisma 'schema'
        qs = urllib.parse.parse_qs(parsed.query)
        qs.pop('schema', None)
        new_query = urllib.parse.urlencode(qs, doseq=True)
        db_url = urllib.parse.urlunparse(parsed._replace(query=new_query))

    conn = None
    try:
        if db_url:
            print(f"Connecting to PostgreSQL using connection URL: {db_url.split('@')[-1] if '@' in db_url else 'specified URL'}")
            conn = psycopg2.connect(db_url)
        else:
            print(f"Connecting to PostgreSQL at {args.host}:{args.port}/{args.dbname} as user '{args.user}'...")
            kwargs = {
                "host": args.host,
                "port": args.port,
                "user": args.user,
                "dbname": args.dbname
            }
            if args.password:
                kwargs["password"] = args.password
            conn = psycopg2.connect(**kwargs)
    except Exception as e:
        print("\n" + "="*70)
        print("❌ DATABASE CONNECTION FAILED")
        print("="*70)
        print(f"Details: {e}")
        print("\nHow to fix:")
        print("  1. If your PostgreSQL requires a password, run:")
        print(f"     python export_statistics.py --password \"YOUR_PASSWORD\"")
        print("  2. Or specify your full connection string:")
        print("     python export_statistics.py --db-url \"postgresql://postgres:YOUR_PASSWORD@localhost:5432/etex_game\"")
        print("  3. Or to generate a sample dataset immediately without database connection, run:")
        print("     python export_statistics.py --demo")
        print("="*70 + "\n")
        raise

    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    print("Connected to PostgreSQL successfully. Extracting participation statistics...")

    # 1. Eligibility Threshold
    cur.execute('SELECT value FROM "SystemSetting" WHERE key = %s;', ('eligibilityScoreThreshold',))
    row = cur.fetchone()
    threshold = int(row['value']) if row and row['value'] and row['value'].isdigit() else 7

    # 2. Total Participants
    cur.execute('SELECT COUNT(*) as cnt FROM "User" WHERE role = %s;', ('PARTICIPANT',))
    total_participants = cur.fetchone()['cnt']

    # 3. Quiz Sessions count & Average Score
    cur.execute('''
        SELECT 
            COUNT(*) as total_sessions,
            COUNT(CASE WHEN total > 0 THEN 1 END) as completed_sessions,
            COALESCE(AVG(CASE WHEN total > 0 THEN score END), 0) as avg_score
        FROM "QuizSession";
    ''')
    session_row = cur.fetchone()
    total_sessions = session_row['total_sessions']
    completed_sessions = session_row['completed_sessions']
    average_score = round(float(session_row['avg_score']), 1)

    # 4. Eligible Participants (Users who have at least one completed session with score >= threshold)
    cur.execute('''
        SELECT COUNT(DISTINCT u.id) as cnt
        FROM "User" u
        JOIN "QuizSession" qs ON qs."userId" = u.id
        WHERE u.role = 'PARTICIPANT' AND qs.score >= %s;
    ''', (threshold,))
    eligible_participants = cur.fetchone()['cnt']
    ineligible_participants = max(0, total_participants - eligible_participants)
    eligibility_rate = round((eligible_participants / total_participants * 100), 1) if total_participants > 0 else 0.0

    # 5. Total Answers & Accuracy
    cur.execute('''
        SELECT 
            COUNT(*) as total_answers,
            COUNT(CASE WHEN "isCorrect" = true THEN 1 END) as correct_answers,
            COUNT(CASE WHEN "isCorrect" = false THEN 1 END) as incorrect_answers
        FROM "Answer";
    ''')
    ans_row = cur.fetchone()
    total_answers = ans_row['total_answers']
    correct_answers = ans_row['correct_answers']
    incorrect_answers = ans_row['incorrect_answers']
    overall_accuracy_rate = round((correct_answers / total_answers * 100), 1) if total_answers > 0 else 0.0

    # 6. Score Distribution (0 through 10)
    score_distribution = {str(i): 0 for i in range(11)}
    cur.execute('''
        SELECT score, COUNT(*) as cnt
        FROM "QuizSession"
        WHERE total > 0
        GROUP BY score
        ORDER BY score;
    ''')
    for row in cur.fetchall():
        s = min(max(int(row['score']), 0), 10)
        score_distribution[str(s)] = (score_distribution.get(str(s), 0) + row['cnt'])

    # 7. Per-Question Accuracy Breakdown
    cur.execute('''
        SELECT 
            q.id,
            q."questionText" as question,
            q."isActive",
            COUNT(a.id) as total_answers,
            COUNT(CASE WHEN a."isCorrect" = true THEN 1 END) as correct_answers,
            COUNT(CASE WHEN a."isCorrect" = false THEN 1 END) as incorrect_answers
        FROM "Question" q
        LEFT JOIN "Answer" a ON a."questionId" = q.id
        GROUP BY q.id, q."questionText", q."isActive"
        ORDER BY q.id;
    ''')
    question_stats = []
    for r in cur.fetchall():
        tot = r['total_answers']
        corr = r['correct_answers']
        incorr = r['incorrect_answers']
        acc = round((corr / tot * 100), 1) if tot > 0 else 0.0
        
        diff = "Easy" if acc >= 75 else ("Moderate" if acc >= 50 else "Challenging")
        if tot == 0:
            diff = "Not Attempted"

        question_stats.append({
            "id": r['id'],
            "question": r['question'],
            "isActive": r['isActive'],
            "totalAnswers": tot,
            "correctAnswers": corr,
            "incorrectAnswers": incorr,
            "accuracyRate": acc,
            "difficulty": diff
        })

    # 8. Daily Participation Trend (last 14 days)
    cur.execute('''
        SELECT 
            TO_CHAR("createdAt", 'YYYY-MM-DD') as date_str,
            COUNT(*) as attempts,
            COUNT(CASE WHEN score >= %s THEN 1 END) as eligible_attempts,
            COUNT(DISTINCT "userId") as unique_participants
        FROM "QuizSession"
        WHERE total > 0
        GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
        ORDER BY date_str DESC
        LIMIT 14;
    ''', (threshold,))
    daily_rows = cur.fetchall()
    daily_trend = []
    for r in reversed(daily_rows):
        daily_trend.append({
            "date": r['date_str'],
            "attempts": r['attempts'],
            "eligible": r['eligible_attempts'],
            "uniqueParticipants": r['unique_participants']
        })

    # If no daily rows exist yet, populate default
    if not daily_trend:
        today_str = datetime.now().strftime("%Y-%m-%d")
        daily_trend = [{"date": today_str, "attempts": completed_sessions, "eligible": eligible_participants, "uniqueParticipants": total_participants}]

    # 9. Lottery Winners
    cur.execute('SELECT "rewardType", COUNT(*) as cnt FROM "LotteryWinner" GROUP BY "rewardType";')
    lottery_counts = {"MINI": 0, "GRAND": 0}
    for r in cur.fetchall():
        reward_type = str(r['rewardType']).upper()
        lottery_counts[reward_type] = r['cnt']

    # 10. Regional Participation (if users have region set)
    cur.execute('''
        SELECT COALESCE(NULLIF(region, ''), 'Unspecified') as region_name, COUNT(*) as cnt
        FROM "User"
        WHERE role = 'PARTICIPANT'
        GROUP BY region_name
        ORDER BY cnt DESC
        LIMIT 6;
    ''')
    regional_data = []
    for r in cur.fetchall():
        regional_data.append({"region": r['region_name'], "count": r['cnt']})

    conn.close()

    now = datetime.now(timezone.utc)
    return {
        "meta": {
            "title": "ETEX Quiz Game Participation & Performance Report",
            "exportedAt": now.isoformat(),
            "exportedAtFormatted": now.strftime("%b %d, %Y - %I:%M %p UTC"),
            "source": "PostgreSQL Database (Live Export)",
            "version": "1.0"
        },
        "summary": {
            "totalParticipants": total_participants,
            "totalSessions": total_sessions,
            "completedSessions": completed_sessions,
            "eligibleParticipants": eligible_participants,
            "ineligibleParticipants": ineligible_participants,
            "eligibilityRate": eligibility_rate,
            "eligibilityThreshold": threshold,
            "averageScore": average_score,
            "totalQuestions": len(question_stats),
            "totalAnswers": total_answers,
            "correctAnswers": correct_answers,
            "incorrectAnswers": incorrect_answers,
            "overallAccuracyRate": overall_accuracy_rate,
            "miniLotteryWinners": lottery_counts.get("MINI", 0),
            "grandLotteryWinners": lottery_counts.get("GRAND", 0)
        },
        "scoreDistribution": score_distribution,
        "eligibilityBreakdown": {
            "eligible": eligible_participants,
            "notEligible": ineligible_participants,
            "threshold": threshold
        },
        "accuracyBreakdown": {
            "correct": correct_answers,
            "incorrect": incorrect_answers
        },
        "questionStats": question_stats,
        "dailyTrend": daily_trend,
        "regionalParticipation": regional_data
    }


def main():
    args = parse_args()
    
    print("\n=======================================================")
    print("      ETEX Quiz Game - Statistics Exporter")
    print("=======================================================\n")

    if args.demo:
        print("[*] Mode: Demo / Sample Data Generation")
        data = generate_sample_data()
    else:
        try:
            data = fetch_from_database(args)
        except Exception:
            print("\nFalling back to generating sample data so your JSON and HTML files are ready immediately...")
            data = generate_sample_data()
            data["meta"]["source"] = "Sample / Demo Data (PostgreSQL connection required for live data)"

    # Write primary JSON output
    out_path = os.path.abspath(args.output)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"[+] Statistics JSON written to: {out_path}")

    # Also write statistics_data.js for direct file:// browsing without browser CORS blocks
    js_out_path = os.path.splitext(out_path)[0] + ".js"
    with open(js_out_path, "w", encoding="utf-8") as f:
        f.write("window.STATISTICS_DATA = " + json.dumps(data, indent=2, ensure_ascii=False) + ";\n")
    print(f"[+] Statistics JS written to: {js_out_path}")

    # Optionally copy to public/ directory for Next.js web serving
    if args.copy_to_public:
        public_dir = os.path.join(os.path.dirname(__file__), "public")
        if os.path.exists(public_dir):
            public_out = os.path.join(public_dir, "statistics_data.json")
            with open(public_out, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"[+] Copy also written to: {public_out}")

            public_js_out = os.path.join(public_dir, "statistics_data.js")
            with open(public_js_out, "w", encoding="utf-8") as f:
                f.write("window.STATISTICS_DATA = " + json.dumps(data, indent=2, ensure_ascii=False) + ";\n")
            print(f"[+] Copy also written to: {public_js_out}")

    print("\nSummary of Exported Data:")
    print(f"  * Total Participants:    {data['summary']['totalParticipants']}")
    print(f"  * Completed Sessions:    {data['summary']['completedSessions']}")
    print(f"  * Average Score:         {data['summary']['averageScore']} / 10")
    print(f"  * Eligibility Rate:      {data['summary']['eligibilityRate']}% (Score >= {data['summary']['eligibilityThreshold']})")
    print(f"  * Total Answers:         {data['summary']['totalAnswers']} ({data['summary']['overallAccuracyRate']}% correct)")
    print(f"  * Questions Analyzed:    {len(data['questionStats'])}")
    print("\nYou can now open 'statistics.html' in your browser to view the interactive dashboard!\n")


if __name__ == "__main__":
    main()
