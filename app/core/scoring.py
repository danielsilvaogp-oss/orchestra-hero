from app.config import TIMING_WINDOWS, POINTS

class ScoringSystem:
    def __init__(self):
        self.score = 0
        self.combo = 0
        self.max_combo = 0
        self.hits = {
            "perfect": 0,
            "great": 0,
            "good": 0,
            "ok": 0,
            "miss": 0
        }
        self.total_notes = 0
        self.streak_multiplier = 1.0
        self.max_streak = 0
        self.current_streak = 0
        
    def reset(self):
        self.score = 0
        self.combo = 0
        self.max_combo = 0
        self.hits = {
            "perfect": 0,
            "great": 0,
            "good": 0,
            "ok": 0,
            "miss": 0
        }
        self.total_notes = 0
        self.streak_multiplier = 1.0
        self.max_streak = 0
        self.current_streak = 0
    
    def set_total_notes(self, count):
        self.total_notes = count
    
    def add_hit(self, timing):
        self.hits[timing] += 1
        
        if timing == "miss":
            self.combo = 0
            self.current_streak = 0
            self.streak_multiplier = 1.0
        else:
            points = POINTS[timing]
            self.combo += 1
            self.current_streak += 1
            
            if self.combo >= 50:
                self.streak_multiplier = 4.0
            elif self.combo >= 30:
                self.streak_multiplier = 3.0
            elif self.combo >= 10:
                self.streak_multiplier = 2.0
            else:
                self.streak_multiplier = 1.0
            
            points_earned = int(points * self.streak_multiplier)
            self.score += points_earned
            
            if self.combo > self.max_combo:
                self.max_combo = self.combo
            if self.current_streak > self.max_streak:
                self.max_streak = self.current_streak
    
    def get_accuracy(self):
        total_hits = sum(self.hits.values())
        if total_hits == 0:
            return 0.0
        
        weighted_hits = (
            self.hits["perfect"] * 100 +
            self.hits["great"] * 75 +
            self.hits["good"] * 50 +
            self.hits["ok"] * 25
        ) / 100
        
        perfect_possible = total_hits
        return (weighted_hits / perfect_possible) * 100 if perfect_possible > 0 else 0
    
    def get_raw_accuracy(self):
        total_hits = sum(self.hits.values())
        if total_hits == 0 or self.total_notes == 0:
            return 0.0
        
        non_misses = total_hits - self.hits["miss"]
        return (non_misses / self.total_notes) * 100
    
    def get_grade(self):
        accuracy = self.get_accuracy()
        
        if accuracy >= 98:
            return "S"
        elif accuracy >= 95:
            return "A"
        elif accuracy >= 90:
            return "B"
        elif accuracy >= 80:
            return "C"
        elif accuracy >= 70:
            return "D"
        else:
            return "F"
    
    def get_results(self):
        return {
            "score": self.score,
            "accuracy": self.get_accuracy(),
            "raw_accuracy": self.get_raw_accuracy(),
            "grade": self.get_grade(),
            "max_combo": self.max_combo,
            "max_streak": self.max_streak,
            "hits": self.hits.copy(),
            "total_notes": self.total_notes,
            "combo_multiplier": self.streak_multiplier
        }
    
    def get_hit_percentage(self):
        if self.total_notes == 0:
            return 0
        total = sum(self.hits.values())
        return (total / self.total_notes) * 100

class HitFeedback:
    def __init__(self, timing, note, x, y):
        self.timing = timing
        self.note = note
        self.x = x
        self.y = y
        self.lifetime = 1.0
        self.max_lifetime = 1.0
        
        if timing == "perfect":
            self.color = (255, 215, 0)
            self.text = "PERFECT!"
            self.size = 36
        elif timing == "great":
            self.color = (0, 255, 100)
            self.text = "GREAT!"
            self.size = 32
        elif timing == "good":
            self.color = (100, 150, 255)
            self.text = "GOOD"
            self.size = 28
        elif timing == "ok":
            self.color = (200, 200, 200)
            self.text = "OK"
            self.size = 24
        else:
            self.color = (255, 50, 50)
            self.text = "MISS"
            self.size = 28
    
    def update(self, dt):
        self.lifetime -= dt
        return self.lifetime > 0
    
    def get_alpha(self):
        return int(255 * (self.lifetime / self.max_lifetime))

class StreakDisplay:
    def __init__(self):
        self.current_streak = 0
        self.display_value = 0
        self.target_value = 0
        
    def update(self, streak):
        self.target_value = streak
        
    def update_animation(self, dt):
        if self.display_value < self.target_value:
            self.display_value += int(10 * dt)
            if self.display_value > self.target_value:
                self.display_value = self.target_value
    
    def get_display(self):
        return self.display_value

class ScoreDisplay:
    def __init__(self):
        self.score = 0
        self.display_score = 0
        self.score_increment = 0
        
    def add_score(self, points):
        self.score_increment = points
        
    def update(self, dt):
        if self.display_score < self.score:
            inc = max(1, int((self.score - self.display_score) * 10 * dt))
            self.display_score += inc
            if self.display_score > self.score:
                self.display_score = self.score
    
    def get_display(self):
        return self.display_score

if __name__ == "__main__":
    scoring = ScoringSystem()
    scoring.set_total_notes(100)
    
    scoring.add_hit("perfect")
    scoring.add_hit("perfect")
    scoring.add_hit("great")
    scoring.add_hit("good")
    scoring.add_hit("miss")
    scoring.add_hit("perfect")
    
    results = scoring.get_results()
    print(f"Score: {results['score']}")
    print(f"Accuracy: {results['accuracy']:.1f}%")
    print(f"Grade: {results['grade']}")
    print(f"Max Combo: {results['max_combo']}")
    print(f"Hits: {results['hits']}")