/**
 * Health Reminders Module - Handles digital wellbeing and health reminders
 */
class HealthReminders {
    constructor() {
        this.reminders = {
            posture: {
                title: 'Posture Check',
                message: 'Time to check your posture! Sit up straight and align your spine.',
                icon: '🧘‍♂️',
                enabled: false,
                interval: 30,
                unit: 'minutes',
                nextReminder: null,
                timeoutId: null
            },
            hydration: {
                title: 'Drink Water',
                message: 'Stay hydrated! Time to drink some water.',
                icon: '💧',
                enabled: false,
                interval: 45,
                unit: 'minutes',
                nextReminder: null,
                timeoutId: null
            },
            eye: {
                title: 'Eye Break (20-20-20)',
                message: 'Look at something 20 feet away for 20 seconds to rest your eyes.',
                icon: '👁️',
                enabled: false,
                interval: 20,
                unit: 'minutes',
                nextReminder: null,
                timeoutId: null
            },
            movement: {
                title: 'Take a Walk',
                message: 'Get up and move around for better circulation!',
                icon: '🚶‍♂️',
                enabled: false,
                interval: 60,
                unit: 'minutes',
                nextReminder: null,
                timeoutId: null
            },
            breathing: {
                title: 'Deep Breathing',
                message: 'Take 5 deep breaths to reduce stress and improve focus.',
                icon: '🫁',
                enabled: false,
                interval: 90,
                unit: 'minutes',
                nextReminder: null,
                timeoutId: null
            },
            screen: {
                title: 'Screen Break',
                message: 'Step away from your screen for a few minutes.',
                icon: '🖥️',
                enabled: false,
                interval: 2,
                unit: 'hours',
                nextReminder: null,
                timeoutId: null
            }
        };
        
        this.settings = {
            soundNotifications: true,
            persistentNotifications: false,
            focusModePause: true
        };
        
        this.stats = {
            totalRemindersToday: 0,
            remindersFollowed: 0,
            healthScore: 0
        };
    }
    
    /**
     * Initialize health reminders
     */
    init() {
        this.loadSettings();
        this.initEventListeners();
        this.updateUI();
        this.checkNotificationPermission();
    }
    
    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Master toggle
        const masterToggle = document.getElementById('reminders-master-toggle');
        if (masterToggle) {
            masterToggle.addEventListener('change', (e) => {
                this.toggleAllReminders(e.target.checked);
            });
        }
        
        // Individual reminder toggles
        document.querySelectorAll('.reminder-toggle').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const type = e.target.dataset.type;
                this.toggleReminder(type, e.target.checked);
            });
        });
        
        // Interval changes
        Object.keys(this.reminders).forEach(type => {
            const intervalInput = document.getElementById(`${type}-interval`);
            const unitSelect = document.getElementById(`${type}-unit`);
            
            if (intervalInput) {
                intervalInput.addEventListener('change', (e) => {
                    this.updateReminderInterval(type, parseInt(e.target.value));
                });
            }
            
            if (unitSelect) {
                unitSelect.addEventListener('change', (e) => {
                    this.updateReminderUnit(type, e.target.value);
                });
            }
        });
    }
    
    /**
     * Check notification permission
     */
    async checkNotificationPermission() {
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                await Notification.requestPermission();
            }
        }
    }
    
    /**
     * Toggle all reminders on/off
     */
    toggleAllReminders(enabled) {
        Object.keys(this.reminders).forEach(type => {
            this.toggleReminder(type, enabled);
            const toggle = document.querySelector(`[data-type="${type}"]`);
            if (toggle) toggle.checked = enabled;
        });
        this.saveSettings();
    }
    
    /**
     * Toggle individual reminder
     */
    toggleReminder(type, enabled) {
        if (!this.reminders[type]) return;
        
        this.reminders[type].enabled = enabled;
        
        if (enabled) {
            this.scheduleReminder(type);
        } else {
            this.cancelReminder(type);
        }
        
        this.saveSettings();
        this.updateUI();
    }
    
    /**
     * Update reminder interval
     */
    updateReminderInterval(type, interval) {
        if (!this.reminders[type] || interval < 1) return;
        
        this.reminders[type].interval = interval;
        
        // Reschedule if enabled
        if (this.reminders[type].enabled) {
            this.cancelReminder(type);
            this.scheduleReminder(type);
        }
        
        this.saveSettings();
        this.updateUI();
    }
    
    /**
     * Update reminder unit
     */
    updateReminderUnit(type, unit) {
        if (!this.reminders[type]) return;
        
        this.reminders[type].unit = unit;
        
        // Reschedule if enabled
        if (this.reminders[type].enabled) {
            this.cancelReminder(type);
            this.scheduleReminder(type);
        }
        
        this.saveSettings();
        this.updateUI();
    }
    
    /**
     * Schedule a reminder
     */
    scheduleReminder(type) {
        const reminder = this.reminders[type];
        if (!reminder || !reminder.enabled) return;
        
        // Clear existing timeout
        this.cancelReminder(type);
        
        // Calculate interval in milliseconds
        const intervalMs = reminder.interval * (reminder.unit === 'hours' ? 3600000 : 60000);
        
        // Set next reminder time
        reminder.nextReminder = new Date(Date.now() + intervalMs);
        
        // Schedule the reminder
        reminder.timeoutId = setTimeout(() => {
            this.showReminder(type);
            // Reschedule for next time
            this.scheduleReminder(type);
        }, intervalMs);
    }
    
    /**
     * Cancel a reminder
     */
    cancelReminder(type) {
        const reminder = this.reminders[type];
        if (!reminder) return;
        
        if (reminder.timeoutId) {
            clearTimeout(reminder.timeoutId);
            reminder.timeoutId = null;
        }
        reminder.nextReminder = null;
    }
    
    /**
     * Show a reminder notification
     */
    showReminder(type) {
        const reminder = this.reminders[type];
        if (!reminder) return;
        
        // Update stats
        this.stats.totalRemindersToday++;
        this.saveStats();
        
        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(reminder.title, {
                body: reminder.message,
                icon: '/icons/icon-48.png',
                badge: '/icons/icon-16.png',
                tag: `health-reminder-${type}`,
                requireInteraction: this.settings.persistentNotifications
            });
            
            // Auto-close after 10 seconds if not persistent
            if (!this.settings.persistentNotifications) {
                setTimeout(() => notification.close(), 10000);
            }
            
            // Handle click
            notification.onclick = () => {
                window.focus();
                notification.close();
                this.markReminderFollowed();
            };
        }
        
        // Play sound if enabled
        if (this.settings.soundNotifications) {
            this.playNotificationSound();
        }
    }
    
    /**
     * Play notification sound
     */
    playNotificationSound() {
        // Create and play a simple beep sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Could not play notification sound:', error);
        }
    }
    
    /**
     * Mark reminder as followed
     */
    markReminderFollowed() {
        this.stats.remindersFollowed++;
        this.saveStats();
        this.updateUI();
    }
    
    /**
     * Update UI elements
     */
    updateUI() {
        // Update reminder toggles
        Object.keys(this.reminders).forEach(type => {
            const toggle = document.querySelector(`[data-type="${type}"]`);
            if (toggle) {
                toggle.checked = this.reminders[type].enabled;
            }
            
            const intervalInput = document.getElementById(`${type}-interval`);
            if (intervalInput) {
                intervalInput.value = this.reminders[type].interval;
            }
            
            const unitSelect = document.getElementById(`${type}-unit`);
            if (unitSelect) {
                unitSelect.value = this.reminders[type].unit;
            }
            
            // Update next reminder time
            this.updateNextReminderDisplay(type);
        });
        
        // Update stats
        this.updateStatsDisplay();
        
        // Update master toggle
        const masterToggle = document.getElementById('reminders-master-toggle');
        if (masterToggle) {
            const anyEnabled = Object.values(this.reminders).some(r => r.enabled);
            masterToggle.checked = anyEnabled;
        }
    }
    
    /**
     * Update next reminder display
     */
    updateNextReminderDisplay(type) {
        const reminder = this.reminders[type];
        const displayElement = document.getElementById(`${type}-next`);
        
        if (!displayElement) return;
        
        if (reminder.enabled && reminder.nextReminder) {
            const timeLeft = reminder.nextReminder.getTime() - Date.now();
            if (timeLeft > 0) {
                const minutes = Math.ceil(timeLeft / 60000);
                displayElement.textContent = `Next in ${minutes}m`;
            } else {
                displayElement.textContent = 'Due now';
            }
        } else {
            displayElement.textContent = reminder.enabled ? 'Scheduling...' : 'Disabled';
        }
    }
    
    /**
     * Update stats display
     */
    updateStatsDisplay() {
        const totalElement = document.getElementById('total-reminders-today');
        const followedElement = document.getElementById('reminders-followed');
        const scoreElement = document.getElementById('health-score');
        
        if (totalElement) totalElement.textContent = this.stats.totalRemindersToday;
        if (followedElement) followedElement.textContent = this.stats.remindersFollowed;
        
        // Calculate health score
        const score = this.stats.totalRemindersToday > 0 ? 
            Math.round((this.stats.remindersFollowed / this.stats.totalRemindersToday) * 100) : 0;
        if (scoreElement) scoreElement.textContent = `${score}%`;
    }
    
    /**
     * Load settings from storage
     */
    loadSettings() {
        chrome.storage.local.get(['healthReminders'], (data) => {
            const saved = data.healthReminders || {};
            
            // Load reminder settings
            if (saved.reminders) {
                Object.keys(saved.reminders).forEach(type => {
                    if (this.reminders[type]) {
                        Object.assign(this.reminders[type], saved.reminders[type]);
                    }
                });
            }
            
            // Load general settings
            if (saved.settings) {
                Object.assign(this.settings, saved.settings);
            }
            
            // Load stats
            if (saved.stats) {
                Object.assign(this.stats, saved.stats);
            }
            
            // Reschedule enabled reminders
            Object.keys(this.reminders).forEach(type => {
                if (this.reminders[type].enabled) {
                    this.scheduleReminder(type);
                }
            });
            
            this.updateUI();
        });
    }
    
    /**
     * Save settings to storage
     */
    saveSettings() {
        const data = {
            reminders: this.reminders,
            settings: this.settings,
            stats: this.stats
        };
        
        chrome.storage.local.set({ healthReminders: data });
    }
    
    /**
     * Save stats to storage
     */
    saveStats() {
        chrome.storage.local.get(['healthReminders'], (data) => {
            const saved = data.healthReminders || {};
            saved.stats = this.stats;
            chrome.storage.local.set({ healthReminders: saved });
        });
    }
    
    /**
     * Refresh health reminders data
     */
    async refreshData() {
        this.loadSettings();
        this.updateUI();
    }
    
    /**
     * Reset daily stats (typically called at midnight)
     */
    resetDailyStats() {
        this.stats.totalRemindersToday = 0;
        this.stats.remindersFollowed = 0;
        this.saveStats();
        this.updateUI();
    }
}

// Export for use in main dashboard
window.HealthReminders = HealthReminders;
