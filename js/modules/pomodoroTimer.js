/**
 * Pomodoro Timer Module - Handles pomodoro timer functionality
 */
class PomodoroTimer {
    constructor() {
        this.timerDisplay = document.getElementById('timer-display');
        this.timerMode = document.getElementById('timer-mode');
        this.sessionCount = document.getElementById('session-count');
        this.startPauseBtn = document.getElementById('start-pause-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.skipBtn = document.getElementById('skip-btn');
        this.progressCircle = document.querySelector('.progress-ring-circle.progress');
        
        // Settings inputs
        this.workDurationInput = document.getElementById('work-duration');
        this.shortBreakDurationInput = document.getElementById('short-break-duration');
        this.longBreakDurationInput = document.getElementById('long-break-duration');
        this.sessionsUntilLongBreakInput = document.getElementById('sessions-until-long-break');
        this.autoStartBreaksToggle = document.getElementById('auto-start-breaks');
        this.autoStartWorkToggle = document.getElementById('auto-start-work');
        this.notificationsEnabledToggle = document.getElementById('notifications-enabled');
        
        // Stats elements
        this.completedSessionsDisplay = document.getElementById('completed-sessions');
        this.totalFocusTimeDisplay = document.getElementById('total-focus-time');
        this.productivityScoreDisplay = document.getElementById('productivity-score');
        
        // Timer state
        this.isRunning = false;
        this.currentMode = 'work'; // 'work', 'shortBreak', 'longBreak'
        this.currentSession = 1;
        this.completedWorkSessions = 0; // Track completed work sessions in current cycle
        this.timeLeft = 25 * 60; // 25 minutes in seconds
        this.totalDuration = 25 * 60;
        this.timerInterval = null;
        
        // Progress circle setup
        if (this.progressCircle) {
            this.circumference = 2 * Math.PI * 110; // radius = 110
            this.progressCircle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
            this.progressCircle.style.strokeDashoffset = this.circumference;
        }
        
        this.initializePomodoroTimer();
        this.loadPomodoroSettings();
        this.loadPomodoroStats();
    }
    
    initializePomodoroTimer() {
        if (!this.startPauseBtn) return; // Exit if elements don't exist
        
        this.startPauseBtn.addEventListener('click', () => this.toggleTimer());
        if (this.resetBtn) this.resetBtn.addEventListener('click', () => this.resetTimer());
        if (this.skipBtn) this.skipBtn.addEventListener('click', () => this.skipSession());
        
        // Settings change listeners
        this.workDurationInput?.addEventListener('change', () => this.updateDurations());
        this.shortBreakDurationInput?.addEventListener('change', () => this.updateDurations());
        this.longBreakDurationInput?.addEventListener('change', () => this.updateDurations());
        this.sessionsUntilLongBreakInput?.addEventListener('change', () => this.savePomodoroSettings());
        
        // Toggle listeners
        this.autoStartBreaksToggle?.addEventListener('change', () => this.savePomodoroSettings());
        this.autoStartWorkToggle?.addEventListener('change', () => this.savePomodoroSettings());
        this.notificationsEnabledToggle?.addEventListener('change', () => this.savePomodoroSettings());
        
        this.updateDisplay();
    }
    
    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }
    
    startTimer() {
        this.isRunning = true;
        this.startPauseBtn.innerHTML = '<i class="fas fa-pause"></i><span>Pause</span>';
        
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            this.updateProgress();
            
            if (this.timeLeft <= 0) {
                this.completeSession();
            }
        }, 1000);
    }
    
    pauseTimer() {
        this.isRunning = false;
        this.startPauseBtn.innerHTML = '<i class="fas fa-play"></i><span>Resume</span>';
        clearInterval(this.timerInterval);
    }
    
    resetTimer() {
        this.isRunning = false;
        this.startPauseBtn.innerHTML = '<i class="fas fa-play"></i><span>Start</span>';
        clearInterval(this.timerInterval);
        
        // Reset to work mode and first session
        this.currentMode = 'work';
        this.currentSession = 1;
        this.completedWorkSessions = 0;
        this.totalDuration = parseInt(this.workDurationInput?.value || 25) * 60;
        this.timeLeft = this.totalDuration;
        this.updateDisplay();
        this.updateProgress();
    }
    
    skipSession() {
        this.completeSession();
    }
    
    completeSession() {
        this.isRunning = false;
        clearInterval(this.timerInterval);
        
        if (this.currentMode === 'work') {
            this.completedWorkSessions++;
            this.updatePomodoroStats();
            this.showNotification('Work session completed!', 'Time for a break.');
            
            // Determine break type based on completed work sessions in current cycle
            const sessionsPerCycle = parseInt(this.sessionsUntilLongBreakInput?.value || 4);
            if (this.completedWorkSessions % sessionsPerCycle === 0) {
                this.currentMode = 'longBreak';
                this.totalDuration = parseInt(this.longBreakDurationInput?.value || 15) * 60;
            } else {
                this.currentMode = 'shortBreak';
                this.totalDuration = parseInt(this.shortBreakDurationInput?.value || 5) * 60;
            }
        } else {
            this.showNotification('Break completed!', 'Ready to focus again?');
            this.currentMode = 'work';
            this.totalDuration = parseInt(this.workDurationInput?.value || 25) * 60;
            
            // Update current session number for display
            const sessionsPerCycle = parseInt(this.sessionsUntilLongBreakInput?.value || 4);
            this.currentSession = (this.completedWorkSessions % sessionsPerCycle) + 1;
        }
        
        this.timeLeft = this.totalDuration;
        this.updateDisplay();
        this.updateProgress();
        
        // Auto-start if enabled
        const shouldAutoStart = (this.currentMode === 'work' && this.autoStartWorkToggle?.checked) ||
                              (this.currentMode !== 'work' && this.autoStartBreaksToggle?.checked);
        
        if (shouldAutoStart) {
            setTimeout(() => this.startTimer(), 1000);
        } else {
            this.startPauseBtn.innerHTML = '<i class="fas fa-play"></i><span>Start</span>';
        }
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        if (this.timerDisplay) {
            this.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Update mode display
        const modeText = this.currentMode === 'work' ? 'Work Session' :
                       this.currentMode === 'shortBreak' ? 'Short Break' : 'Long Break';
        if (this.timerMode) {
            this.timerMode.textContent = modeText;
            this.timerMode.className = `timer-mode ${this.currentMode}`;
        }
        
        // Update session count - show current session within the cycle
        const sessionsPerCycle = parseInt(this.sessionsUntilLongBreakInput?.value || 4);
        let displaySession = this.currentSession;
        
        // If we're in a break, show the next work session number
        if (this.currentMode !== 'work') {
            displaySession = (this.completedWorkSessions % sessionsPerCycle) + 1;
        }
        
        // Show cycle information for better context
        const currentCycle = Math.floor(this.completedWorkSessions / sessionsPerCycle) + 1;
        if (this.sessionCount) {
            this.sessionCount.textContent = `Session ${displaySession} of ${sessionsPerCycle} (Cycle ${currentCycle})`;
        }
    }
    
    updateProgress() {
        if (!this.progressCircle) return;
        
        const progress = (this.totalDuration - this.timeLeft) / this.totalDuration;
        const offset = this.circumference - (progress * this.circumference);
        this.progressCircle.style.strokeDashoffset = offset;
    }
    
    updateDurations() {
        if (this.currentMode === 'work') {
            this.totalDuration = parseInt(this.workDurationInput?.value || 25) * 60;
        } else if (this.currentMode === 'shortBreak') {
            this.totalDuration = parseInt(this.shortBreakDurationInput?.value || 5) * 60;
        } else {
            this.totalDuration = parseInt(this.longBreakDurationInput?.value || 15) * 60;
        }
        
        if (!this.isRunning) {
            this.timeLeft = this.totalDuration;
            this.updateDisplay();
            this.updateProgress();
        }
        
        this.savePomodoroSettings();
    }
    
    showNotification(title, message) {
        if (this.notificationsEnabledToggle?.checked && 'Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification(title, {
                    body: message,
                    icon: '/icons/icon-48.png'
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification(title, {
                            body: message,
                            icon: '/icons/icon-48.png'
                        });
                    }
                });
            }
        }
    }
    
    savePomodoroSettings() {
        const settings = {
            workDuration: parseInt(this.workDurationInput?.value || 25),
            shortBreakDuration: parseInt(this.shortBreakDurationInput?.value || 5),
            longBreakDuration: parseInt(this.longBreakDurationInput?.value || 15),
            sessionsUntilLongBreak: parseInt(this.sessionsUntilLongBreakInput?.value || 4),
            autoStartBreaks: this.autoStartBreaksToggle?.checked || false,
            autoStartWork: this.autoStartWorkToggle?.checked || false,
            notificationsEnabled: this.notificationsEnabledToggle?.checked !== false
        };
        
        chrome.storage.local.set({ pomodoroSettings: settings });
    }
    
    loadPomodoroSettings() {
        chrome.storage.local.get(['pomodoroSettings'], (data) => {
            const settings = data.pomodoroSettings || {};
            
            if (this.workDurationInput) this.workDurationInput.value = settings.workDuration || 25;
            if (this.shortBreakDurationInput) this.shortBreakDurationInput.value = settings.shortBreakDuration || 5;
            if (this.longBreakDurationInput) this.longBreakDurationInput.value = settings.longBreakDuration || 15;
            if (this.sessionsUntilLongBreakInput) this.sessionsUntilLongBreakInput.value = settings.sessionsUntilLongBreak || 4;
            if (this.autoStartBreaksToggle) this.autoStartBreaksToggle.checked = settings.autoStartBreaks || false;
            if (this.autoStartWorkToggle) this.autoStartWorkToggle.checked = settings.autoStartWork || false;
            if (this.notificationsEnabledToggle) this.notificationsEnabledToggle.checked = settings.notificationsEnabled !== false;
            
            this.updateDurations();
        });
    }
    
    updatePomodoroStats() {
        const today = new Date().toDateString();
        
        chrome.storage.local.get(['pomodoroStats'], (data) => {
            const stats = data.pomodoroStats || {};
            const todayStats = stats[today] || { completedSessions: 0, totalFocusTime: 0 };
            
            todayStats.completedSessions++;
            todayStats.totalFocusTime += parseInt(this.workDurationInput?.value || 25);
            stats[today] = todayStats;
            
            chrome.storage.local.set({ pomodoroStats: stats });
            this.loadPomodoroStats();
        });
    }
    
    loadPomodoroStats() {
        const today = new Date().toDateString();
        
        chrome.storage.local.get(['pomodoroStats'], (data) => {
            const stats = data.pomodoroStats || {};
            const todayStats = stats[today] || { completedSessions: 0, totalFocusTime: 0 };
            
            if (this.completedSessionsDisplay) {
                this.completedSessionsDisplay.textContent = todayStats.completedSessions;
            }
            
            const hours = Math.floor(todayStats.totalFocusTime / 60);
            const minutes = todayStats.totalFocusTime % 60;
            if (this.totalFocusTimeDisplay) {
                this.totalFocusTimeDisplay.textContent = `${hours}h ${minutes}m`;
            }
            
            // Calculate productivity score (simple formula)
            const targetSessions = 8; // Target 8 sessions per day
            const productivityScore = Math.min(100, Math.round((todayStats.completedSessions / targetSessions) * 100));
            if (this.productivityScoreDisplay) {
                this.productivityScoreDisplay.textContent = `${productivityScore}%`;
            }
        });
    }
}

// Export for use in main dashboard
window.PomodoroTimer = PomodoroTimer;
