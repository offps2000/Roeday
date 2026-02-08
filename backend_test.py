#!/usr/bin/env python3

import requests
import json
import sys
import time
from datetime import datetime

class RoseDayAPITester:
    def __init__(self, base_url="https://sunny-bloom-quest.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status} | {name}")
        if details:
            print(f"    Details: {details}")
        if success:
            self.tests_passed += 1
        else:
            self.failed_tests.append({"name": name, "details": details})

    def test_root_endpoint(self):
        """Test root API endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}, Response: {response.json()}"
            self.log_test("Root endpoint accessible", success, details)
            return success
        except Exception as e:
            self.log_test("Root endpoint accessible", False, f"Error: {str(e)}")
            return False

    def test_game_status(self):
        """Test game status endpoint"""
        try:
            response = requests.get(f"{self.api_url}/game/status", timeout=10)
            if response.status_code != 200:
                self.log_test("Game status endpoint", False, f"Status: {response.status_code}")
                return False
            
            data = response.json()
            required_fields = ["model_ready", "question_count", "max_questions", "game_over", "guessed_correctly"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_test("Game status endpoint", False, f"Missing fields: {missing_fields}")
                return False
                
            self.log_test("Game status endpoint", True, f"Model ready: {data.get('model_ready')}, Questions: {data.get('question_count')}/{data.get('max_questions')}")
            return data
        except Exception as e:
            self.log_test("Game status endpoint", False, f"Error: {str(e)}")
            return False

    def test_game_reset(self):
        """Test game reset endpoint"""
        try:
            response = requests.post(f"{self.api_url}/game/reset", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}, Response: {response.json()}"
            self.log_test("Game reset endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("Game reset endpoint", False, f"Error: {str(e)}")
            return False

    def test_ask_question(self, question="Is it alive?"):
        """Test ask question endpoint"""
        try:
            payload = {"question": question}
            response = requests.post(
                f"{self.api_url}/game/ask",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            if response.status_code != 200:
                self.log_test(f"Ask question: '{question}'", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
            
            data = response.json()
            required_fields = ["label", "question_count", "max_questions", "game_over", "guessed_correctly"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_test(f"Ask question: '{question}'", False, f"Missing fields: {missing_fields}")
                return False
                
            self.log_test(f"Ask question: '{question}'", True, f"Label: {data.get('label')}, Question count: {data.get('question_count')}")
            return data
        except Exception as e:
            self.log_test(f"Ask question: '{question}'", False, f"Error: {str(e)}")
            return False

    def test_make_guess(self, guess="rose"):
        """Test guess endpoint"""
        try:
            payload = {"guess": guess}
            response = requests.post(
                f"{self.api_url}/game/guess",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            if response.status_code != 200:
                self.log_test(f"Make guess: '{guess}'", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
            
            data = response.json()
            required_fields = ["correct", "message", "question_count", "game_over"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_test(f"Make guess: '{guess}'", False, f"Missing fields: {missing_fields}")
                return False
                
            self.log_test(f"Make guess: '{guess}'", True, f"Correct: {data.get('correct')}, Message: {data.get('message')}")
            return data
        except Exception as e:
            self.log_test(f"Make guess: '{guess}'", False, f"Error: {str(e)}")
            return False

    def wait_for_model_ready(self, max_wait_time=90):
        """Wait for ML model to be ready"""
        print(f"\n🤖 Waiting for ML model to load (max {max_wait_time}s)...")
        start_time = time.time()
        
        while time.time() - start_time < max_wait_time:
            status = self.test_game_status()
            if status and status.get("model_ready"):
                print("✅ Model is ready!")
                return True
            
            time.sleep(3)
            elapsed = int(time.time() - start_time)
            print(f"   ⏳ Still loading... ({elapsed}s elapsed)")
        
        print("❌ Model did not load within the timeout period")
        return False

    def run_full_game_flow(self):
        """Test a complete game flow"""
        print("\n🎮 Testing complete game flow...")
        
        # Reset the game first
        if not self.test_game_reset():
            return False
        
        # Ask a few questions
        questions = [
            "Is it alive?",
            "Is it a plant?", 
            "Does it have petals?",
            "Is it used for romance?"
        ]
        
        for question in questions:
            result = self.test_ask_question(question)
            if not result:
                return False
            time.sleep(1)  # Small delay between questions
        
        # Make the correct guess
        guess_result = self.test_make_guess("rose")
        if not guess_result:
            return False
            
        # Verify the guess was correct
        if guess_result.get("correct"):
            self.log_test("Full game flow - correct guess", True, "Successfully guessed 'rose'")
            return True
        else:
            self.log_test("Full game flow - correct guess", False, "Rose guess was not recognized as correct")
            return False

def main():
    print("🌹 Rose Day API Testing Suite")
    print("=" * 50)
    
    tester = RoseDayAPITester()
    
    # Test basic connectivity
    print("\n📡 Testing basic connectivity...")
    if not tester.test_root_endpoint():
        print("❌ Root endpoint failed. Cannot continue testing.")
        return 1
    
    # Test game status 
    print("\n📊 Testing game status...")
    status = tester.test_game_status()
    if not status:
        print("❌ Game status failed. Cannot continue testing.")
        return 1
    
    # Wait for model to be ready if needed
    if not status.get("model_ready", False):
        if not tester.wait_for_model_ready():
            print("❌ Model never became ready. Some tests will fail.")
            # Continue with other tests anyway
    
    # Test individual endpoints
    print("\n🔧 Testing individual endpoints...")
    tester.test_game_reset()
    tester.test_ask_question("Is it alive?")
    tester.test_ask_question("Is it a plant?")
    tester.test_make_guess("wrong answer")
    tester.test_make_guess("rose")
    
    # Test complete game flow
    tester.run_full_game_flow()
    
    # Summary
    print("\n" + "=" * 50)
    print("📋 TEST SUMMARY")
    print("=" * 50)
    print(f"Total Tests: {tester.tests_run}")
    print(f"Passed: {tester.tests_passed}")
    print(f"Failed: {len(tester.failed_tests)}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.failed_tests:
        print("\n❌ FAILED TESTS:")
        for test in tester.failed_tests:
            print(f"  • {test['name']}: {test['details']}")
    
    if tester.tests_passed == tester.tests_run:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {len(tester.failed_tests)} test(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())