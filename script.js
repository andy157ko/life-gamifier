// Life Gamifier App
class LifeGamifier {
    constructor() {
        this.defaultHabits = ['sleep', 'gym', 'run', 'screen'];
        this.habits = [...this.defaultHabits];
        this.data = this.loadData();
        this.user = null;
        this.isOnline = false;
        this.init();
    }

    init() {
        this.updateDisplay();
        this.checkForNewDay();
        this.updateProgress();
        this.updateCurrentStreak();
        this.updateAchievements();
        this.updateNotificationStatus();
        this.updateScheduledHabits();
        this.setupNotificationCheck();
        this.setupFirebaseAuth();
    }

    loadData() {
        const defaultData = {
            habits: {
                sleep: { streak: 0, lastCompleted: null, lastRestDay: null, totalCompleted: 0, name: '7+ Hours Sleep', description: 'Get quality rest for better health', icon: '😴', category: 'health' },
                gym: { streak: 0, lastCompleted: null, lastRestDay: null, totalCompleted: 0, name: 'Gym Workout', description: 'Build strength and endurance', icon: '💪', category: 'health' },
                run: { streak: 0, lastCompleted: null, lastRestDay: null, totalCompleted: 0, name: 'Go for a Run', description: 'Cardio for heart health', icon: '🏃', category: 'health' },
                screen: { streak: 0, lastCompleted: null, lastRestDay: null, totalCompleted: 0, name: 'Under 5h Screen Time', description: 'Reduce digital consumption', icon: '📱', category: 'productivity' }
            },
            customHabits: {},
            currentStreak: 0,
            bestStreak: 0,
            achievements: ['🎯 Start your journey!'],
            lastResetDate: new Date().toDateString(),
            lastStreakCalculation: null,
            notificationsEnabled: false,
            scheduledHabits: {}
        };

        const saved = localStorage.getItem('lifeGamifierData');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Merge with defaults to handle new properties
            const merged = { ...defaultData, ...parsed };
            
            // Update existing habit data if needed
            if (merged.habits && merged.habits.sleep && merged.habits.sleep.name === '8+ Hours Sleep') {
                merged.habits.sleep.name = '7+ Hours Sleep';
                // Save the updated data immediately
                localStorage.setItem('lifeGamifierData', JSON.stringify(merged));
            }
            
            // Load custom habits into the habits array
            if (merged.customHabits) {
                Object.keys(merged.customHabits).forEach(habitId => {
                    if (!this.habits.includes(habitId)) {
                        this.habits.push(habitId);
                    }
                });
            }
            
            return merged;
        }
        return defaultData;
    }

    saveData() {
        localStorage.setItem('lifeGamifierData', JSON.stringify(this.data));
    }

    checkForNewDay() {
        const today = new Date().toDateString();
        if (this.data.lastResetDate !== today) {
            this.resetDailyHabits();
            this.data.lastResetDate = today;
            this.saveData();
        }
    }

    resetDailyHabits() {
        // Reset all habits for the new day
        this.habits.forEach(habit => {
            const habitData = this.getHabitData(habit);
            if (habitData && habitData.lastCompleted !== new Date().toDateString()) {
                // If habit wasn't completed yesterday, reset streak
                if (habitData.lastCompleted && 
                    new Date(habitData.lastCompleted).toDateString() !== 
                    new Date(Date.now() - 86400000).toDateString()) {
                    habitData.streak = 0;
                }
            }
        });
    }

    getHabitData(habitId) {
        return this.data.habits[habitId] || this.data.customHabits[habitId];
    }

    toggleHabit(habitName) {
        const today = new Date().toDateString();
        const habitData = this.getHabitData(habitName);
        const button = document.getElementById(`${habitName}Btn`);
        
        if (habitData.lastCompleted === today) {
            // Already completed today, undo
            habitData.lastCompleted = null;
            habitData.totalCompleted = Math.max(0, habitData.totalCompleted - 1);
            button.classList.remove('completed');
            this.showNotification(`Undid ${habitName} completion`, 'info');
        } else {
            // Mark as completed for the first time today
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            const wasCompletedYesterday = habitData.lastCompleted === yesterday;
            const wasRestDayYesterday = habitData.lastRestDay === yesterday;
            const isFirstTimeToday = habitData.lastCompleted !== today;
            
            habitData.lastCompleted = today;
            habitData.totalCompleted++;
            
            // Clear any rest day for today
            if (habitData.lastRestDay === today) {
                habitData.lastRestDay = null;
                const restButton = document.getElementById(`${habitName}RestBtn`);
                if (restButton) restButton.classList.remove('rest-day');
            }
            
            // Update streak only if this is the first completion today
            if (isFirstTimeToday) {
                if (wasCompletedYesterday || wasRestDayYesterday) {
                    // Continue streak (either completed or rested yesterday)
                    habitData.streak++;
                } else {
                    // Start new streak
                    habitData.streak = 1;
                }
            }
            
            button.classList.add('completed');
            this.showNotification(`Great job! ${habitName} streak: ${habitData.streak}`, 'success');
            
            // Check for achievements
            this.checkAchievements(habitName, habitData.streak);
        }
        
        this.saveData();
        this.updateDisplay();
        this.updateProgress();
        this.updateCurrentStreak();
    }

    markRestDay(habitName) {
        const today = new Date().toDateString();
        const habitData = this.getHabitData(habitName);
        const restButton = document.getElementById(`${habitName}RestBtn`);
        
        if (habitData.lastRestDay === today) {
            // Already marked as rest day, undo
            habitData.lastRestDay = null;
            restButton.classList.remove('rest-day');
            this.showNotification(`Undid rest day for ${habitName}`, 'info');
        } else {
            // Mark as rest day
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            const wasCompletedYesterday = habitData.lastCompleted === yesterday;
            const wasRestDayYesterday = habitData.lastRestDay === yesterday;
            
            habitData.lastRestDay = today;
            
            // Clear any completion for today
            if (habitData.lastCompleted === today) {
                habitData.lastCompleted = null;
                habitData.totalCompleted = Math.max(0, habitData.totalCompleted - 1);
                const button = document.getElementById(`${habitName}Btn`);
                if (button) button.classList.remove('completed');
            }
            
            // Update streak logic - rest days maintain streaks
            if (wasCompletedYesterday || wasRestDayYesterday) {
                // Continue streak (either completed or rested yesterday)
                if (habitData.streak === 0) {
                    habitData.streak = 1;
                }
            } else {
                // Start new streak if neither completed nor rested yesterday
                habitData.streak = 1;
            }
            
            restButton.classList.add('rest-day');
            this.showNotification(`Rest day marked for ${habitName} - streak maintained!`, 'success');
        }
        
        this.saveData();
        this.updateDisplay();
        this.updateProgress();
        this.updateCurrentStreak();
    }

    updateDisplay() {
        this.renderHabits();
        this.updateCurrentStreak();
    }

    renderHabits() {
        const habitsList = document.getElementById('habitsList');
        habitsList.innerHTML = '';
        
        this.habits.forEach(habit => {
            const habitData = this.getHabitData(habit);
            if (!habitData) return;
            
            const habitCard = this.createHabitCard(habit, habitData);
            habitsList.appendChild(habitCard);
        });
    }

    createHabitCard(habitId, habitData) {
        const today = new Date().toDateString();
        const isCompleted = habitData.lastCompleted === today;
        const isRestDay = habitData.lastRestDay === today;
        const isCustom = !this.defaultHabits.includes(habitId);
        const showRestButton = habitId === 'gym' || habitId === 'run';
        
        const card = document.createElement('div');
        card.className = 'habit-card';
        card.setAttribute('data-habit', habitId);
        
        card.innerHTML = `
            ${isCustom ? `<button class="habit-delete-btn" onclick="deleteCustomHabit('${habitId}')" title="Delete habit">×</button>` : ''}
            <div class="habit-info">
                <div class="habit-icon">${habitData.icon}</div>
                <div class="habit-details">
                    <h3>${habitData.name}</h3>
                    <p>${habitData.description}</p>
                    <div class="streak-info">Streak: <span class="streak-count" id="${habitId}Streak">${habitData.streak}</span> days</div>
                </div>
            </div>
            <div class="habit-actions">
                <button class="habit-btn ${isCompleted ? 'completed' : ''}" id="${habitId}Btn" onclick="toggleHabit('${habitId}')">
                    <span class="btn-text">Mark Complete</span>
                    <span class="checkmark">✓</span>
                </button>
                ${showRestButton ? `
                    <button class="rest-btn ${isRestDay ? 'rest-day' : ''}" id="${habitId}RestBtn" onclick="markRestDay('${habitId}')">
                        <span class="btn-text">Rest Day</span>
                        <span class="rest-icon">😴</span>
                    </button>
                ` : ''}
            </div>
        `;
        
        return card;
    }

    updateCurrentStreak() {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        // Check if all habits were completed OR rested today (for gym/run)
        let allCompletedToday = true;
        this.habits.forEach(habit => {
            const habitData = this.getHabitData(habit);
            if (habitData) {
                const isCompleted = habitData.lastCompleted === today;
                const isRestDay = (habit === 'gym' || habit === 'run') && habitData.lastRestDay === today;
                if (!isCompleted && !isRestDay) {
                    allCompletedToday = false;
                }
            }
        });
        
        // Check if all habits were completed OR rested yesterday (for gym/run)
        let allCompletedYesterday = true;
        this.habits.forEach(habit => {
            const habitData = this.getHabitData(habit);
            if (habitData) {
                const wasCompleted = habitData.lastCompleted === yesterday;
                const wasRestDay = (habit === 'gym' || habit === 'run') && habitData.lastRestDay === yesterday;
                if (!wasCompleted && !wasRestDay) {
                    allCompletedYesterday = false;
                }
            }
        });
        
        // Calculate current streak based on completion status
        // Only update if this is the first time we're calculating for today
        if (!this.data.lastStreakCalculation || this.data.lastStreakCalculation !== today) {
            if (allCompletedToday) {
                // All habits completed today
                if (allCompletedYesterday) {
                    // Continue existing streak - increment it
                    this.data.currentStreak++;
                } else {
                    // Start new streak (first day all habits completed)
                    this.data.currentStreak = 1;
                }
            } else {
                // Not all habits completed today
                if (!allCompletedYesterday) {
                    // Reset streak if yesterday wasn't completed either
                    this.data.currentStreak = 0;
                }
                // If yesterday was completed but today isn't, keep current streak as is
            }
            
            // Mark that we've calculated the streak for today
            this.data.lastStreakCalculation = today;
        }
        
        // Update best streak if current is higher
        if (this.data.currentStreak > this.data.bestStreak) {
            this.data.bestStreak = this.data.currentStreak;
            if (this.data.currentStreak > 1) { // Only show notification for streaks > 1
                this.showNotification(`New best streak: ${this.data.bestStreak} days!`, 'achievement');
            }
        }
        
        document.getElementById('currentStreak').textContent = this.data.currentStreak;
        document.getElementById('bestStreak').textContent = this.data.bestStreak;
        this.saveData();
    }

    updateProgress() {
        const today = new Date().toDateString();
        let completedCount = 0;
        
        this.habits.forEach(habit => {
            const habitData = this.getHabitData(habit);
            if (habitData) {
                const isCompleted = habitData.lastCompleted === today;
                const isRestDay = (habit === 'gym' || habit === 'run') && habitData.lastRestDay === today;
                if (isCompleted || isRestDay) {
                    completedCount++;
                }
            }
        });
        
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const percentage = (completedCount / this.habits.length) * 100;
        
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `${completedCount}/${this.habits.length} habits completed`;
        
        // Add celebration effect when all habits are completed
        if (completedCount === this.habits.length) {
            this.showNotification('🎉 Perfect day! All habits completed!', 'celebration');
        }
    }

    checkAchievements(habitName, streak) {
        const newAchievements = [];
        
        // Streak achievements
        if (streak === 3) {
            newAchievements.push(`🔥 3-day ${habitName} streak!`);
        } else if (streak === 7) {
            newAchievements.push(`💪 Week-long ${habitName} streak!`);
        } else if (streak === 30) {
            newAchievements.push(`🏆 30-day ${habitName} mastery!`);
        }
        
        // Total completion achievements
        const habitData = this.getHabitData(habitName);
        const totalCompleted = habitData.totalCompleted;
        if (totalCompleted === 10) {
            newAchievements.push(`⭐ 10 ${habitName} completions!`);
        } else if (totalCompleted === 50) {
            newAchievements.push(`🌟 50 ${habitName} completions!`);
        } else if (totalCompleted === 100) {
            newAchievements.push(`💎 100 ${habitName} completions!`);
        }
        
        // Add new achievements
        newAchievements.forEach(achievement => {
            if (!this.data.achievements.includes(achievement)) {
                this.data.achievements.unshift(achievement);
                this.showNotification(achievement, 'achievement');
            }
        });
        
        // Keep only last 10 achievements
        this.data.achievements = this.data.achievements.slice(0, 10);
        this.updateAchievements();
    }

    updateAchievements() {
        const achievementList = document.getElementById('achievementList');
        achievementList.innerHTML = '';
        
        this.data.achievements.forEach(achievement => {
            const achievementItem = document.createElement('div');
            achievementItem.className = 'achievement-item';
            achievementItem.textContent = achievement;
            achievementList.appendChild(achievementItem);
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: type === 'success' ? '#4CAF50' : 
                       type === 'achievement' ? '#FFD700' : 
                       type === 'celebration' ? '#FF6B6B' : '#2196F3',
            color: type === 'achievement' ? '#333' : 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: '1000',
            fontSize: '14px',
            fontWeight: '500',
            maxWidth: '300px',
            textAlign: 'center',
            opacity: '0',
            transition: 'all 0.3s ease'
        });
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(-50%) translateY(0)';
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Export data for backup
    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'life-gamifier-backup.json';
        link.click();
        URL.revokeObjectURL(url);
    }

    // Import data from backup
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                this.data = { ...this.data, ...importedData };
                this.saveData();
                this.updateDisplay();
                this.updateProgress();
                this.updateAchievements();
                this.showNotification('Data imported successfully!', 'success');
            } catch (error) {
                this.showNotification('Error importing data', 'error');
            }
        };
        reader.readAsText(file);
    }

    // Add custom habit
    addCustomHabit(name, description, icon, category, reminderTime = null, enableNotifications = true) {
        const habitId = name.toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + Date.now();
        
        this.data.customHabits[habitId] = {
            name: name,
            description: description,
            icon: icon,
            category: category,
            streak: 0,
            lastCompleted: null,
            lastRestDay: null,
            totalCompleted: 0
        };
        
        // Add scheduling if time is provided
        if (reminderTime && enableNotifications) {
            this.data.scheduledHabits[habitId] = {
                time: reminderTime,
                enabled: true
            };
            this.scheduleNotification(habitId, reminderTime);
        }
        
        this.habits.push(habitId);
        this.saveData();
        this.updateDisplay();
        this.updateProgress();
        this.updateScheduledHabits();
        this.showNotification(`Added new habit: ${name}`, 'success');
    }

    // Delete custom habit
    deleteCustomHabit(habitId) {
        if (confirm('Are you sure you want to delete this habit? This action cannot be undone.')) {
            delete this.data.customHabits[habitId];
            delete this.data.scheduledHabits[habitId];
            this.habits = this.habits.filter(h => h !== habitId);
            this.saveData();
            this.updateDisplay();
            this.updateProgress();
            this.updateScheduledHabits();
            this.showNotification('Habit deleted', 'info');
        }
    }

    // Notification management
    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            this.data.notificationsEnabled = permission === 'granted';
            this.saveData();
            this.updateNotificationStatus();
            
            if (permission === 'granted') {
                this.showNotification('Notifications enabled! You\'ll get reminders for your scheduled habits.', 'success');
            } else {
                this.showNotification('Notifications were denied. You can enable them in your browser settings.', 'info');
            }
        } else {
            this.showNotification('This browser doesn\'t support notifications.', 'info');
        }
    }

    updateNotificationStatus() {
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        const requestBtn = document.getElementById('requestPermissionBtn');
        const disableBtn = document.getElementById('disableNotificationsBtn');
        
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                statusIndicator.textContent = '🔔';
                statusText.textContent = 'Notifications enabled';
                requestBtn.style.display = 'none';
                disableBtn.style.display = 'block';
                this.data.notificationsEnabled = true;
            } else if (Notification.permission === 'denied') {
                statusIndicator.textContent = '🔕';
                statusText.textContent = 'Notifications blocked';
                requestBtn.style.display = 'none';
                disableBtn.style.display = 'none';
                this.data.notificationsEnabled = false;
            } else {
                statusIndicator.textContent = '🔕';
                statusText.textContent = 'Notifications disabled';
                requestBtn.style.display = 'block';
                disableBtn.style.display = 'none';
                this.data.notificationsEnabled = false;
            }
        } else {
            statusIndicator.textContent = '❌';
            statusText.textContent = 'Notifications not supported';
            requestBtn.style.display = 'none';
            disableBtn.style.display = 'none';
        }
    }

    scheduleNotification(habitId, time) {
        if (!this.data.notificationsEnabled || !('Notification' in window)) return;
        
        const habitData = this.getHabitData(habitId);
        if (!habitData) return;
        
        const [hours, minutes] = time.split(':');
        const now = new Date();
        const scheduledTime = new Date();
        scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // If time has passed today, schedule for tomorrow
        if (scheduledTime <= now) {
            scheduledTime.setDate(scheduledTime.getDate() + 1);
        }
        
        const timeUntilNotification = scheduledTime.getTime() - now.getTime();
        
        setTimeout(() => {
            if (this.data.notificationsEnabled) {
                new Notification(`Time for ${habitData.name}!`, {
                    body: habitData.description,
                    icon: '/favicon.ico',
                    tag: `habit-${habitId}`
                });
                
                // Schedule for next day
                this.scheduleNotification(habitId, time);
            }
        }, timeUntilNotification);
    }

    updateScheduledHabits() {
        const scheduledList = document.getElementById('scheduledList');
        const scheduledHabits = Object.keys(this.data.scheduledHabits);
        
        // Update the schedule habit dropdown
        this.updateScheduleHabitDropdown();
        
        if (scheduledHabits.length === 0) {
            scheduledList.innerHTML = '<p class="no-schedules">No scheduled habits yet</p>';
            return;
        }
        
        scheduledList.innerHTML = '';
        scheduledHabits.forEach(habitId => {
            const habitData = this.getHabitData(habitId);
            const scheduleData = this.data.scheduledHabits[habitId];
            
            if (habitData && scheduleData) {
                const scheduledItem = document.createElement('div');
                scheduledItem.className = 'scheduled-item';
                scheduledItem.innerHTML = `
                    <div class="scheduled-info">
                        <span class="scheduled-icon">${habitData.icon}</span>
                        <div class="scheduled-details">
                            <h5>${habitData.name}</h5>
                            <div class="scheduled-time">Daily at ${this.formatTime(scheduleData.time)}</div>
                        </div>
                    </div>
                    <div class="scheduled-actions">
                        <button class="btn-tiny btn-edit" onclick="editHabitSchedule('${habitId}')">Edit</button>
                        <button class="btn-tiny btn-remove" onclick="removeHabitSchedule('${habitId}')">Remove</button>
                    </div>
                `;
                scheduledList.appendChild(scheduledItem);
            }
        });
    }

    updateScheduleHabitDropdown() {
        const dropdown = document.getElementById('scheduleHabitSelect');
        if (!dropdown) return;
        
        // Clear existing options except the first one
        dropdown.innerHTML = '<option value="">Select a habit to schedule...</option>';
        
        // Add all habits that aren't already scheduled
        this.habits.forEach(habitId => {
            const habitData = this.getHabitData(habitId);
            if (habitData && !this.data.scheduledHabits[habitId]) {
                const option = document.createElement('option');
                option.value = habitId;
                option.textContent = `${habitData.icon} ${habitData.name}`;
                dropdown.appendChild(option);
            }
        });
    }

    formatTime(timeString) {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    }

    setupNotificationCheck() {
        // Check for scheduled notifications every minute
        setInterval(() => {
            if (this.data.notificationsEnabled) {
                Object.keys(this.data.scheduledHabits).forEach(habitId => {
                    const scheduleData = this.data.scheduledHabits[habitId];
                    if (scheduleData && scheduleData.enabled) {
                        this.scheduleNotification(habitId, scheduleData.time);
                    }
                });
            }
        }, 60000); // Check every minute
    }

    // Firebase Authentication Methods
    setupFirebaseAuth() {
        if (window.firebaseOnAuthStateChanged) {
            window.firebaseOnAuthStateChanged(window.firebaseAuth, (user) => {
                if (user) {
                    this.user = user;
                    this.isOnline = true;
                    this.updateUserUI(user);
                    this.loadUserDataFromFirestore();
                } else {
                    this.user = null;
                    this.isOnline = false;
                    this.updateUserUI(null);
                    this.loadLocalData();
                }
            });
        }
    }

    updateUserUI(user) {
        const loginBtn = document.getElementById('loginBtn');
        const userInfo = document.getElementById('userInfo');
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');

        if (user) {
            loginBtn.style.display = 'none';
            userInfo.style.display = 'flex';
            userAvatar.src = user.photoURL;
            userName.textContent = user.displayName;
        } else {
            loginBtn.style.display = 'flex';
            userInfo.style.display = 'none';
        }
    }

    async loadUserDataFromFirestore() {
        if (!this.user || !window.firebaseGetDoc || !window.firebaseDoc) return;

        try {
            const userDocRef = window.firebaseDoc(window.firebaseDb, 'users', this.user.uid);
            const userDoc = await window.firebaseGetDoc(userDocRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                this.data = { ...this.data, ...userData };
                this.saveData();
                this.updateDisplay();
                this.updateProgress();
                this.updateCurrentStreak();
                this.updateAchievements();
                this.updateScheduledHabits();
                this.showNotification('Data synced from cloud!', 'success');
            } else {
                // First time user - save their local data to Firestore
                await this.saveUserDataToFirestore();
                this.showNotification('Data saved to cloud!', 'success');
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            this.showNotification('Error syncing data', 'info');
        }
    }

    async saveUserDataToFirestore() {
        if (!this.user || !window.firebaseSetDoc || !window.firebaseDoc) return;

        const syncStatus = document.getElementById('syncStatus');
        if (syncStatus) {
            syncStatus.classList.add('syncing');
            syncStatus.title = 'Syncing to cloud...';
        }

        try {
            const userDocRef = window.firebaseDoc(window.firebaseDb, 'users', this.user.uid);
            await window.firebaseSetDoc(userDocRef, this.data);
            
            if (syncStatus) {
                syncStatus.classList.remove('syncing', 'error');
                syncStatus.title = 'Data synced to cloud';
            }
            return true;
        } catch (error) {
            console.error('Error saving user data:', error);
            if (syncStatus) {
                syncStatus.classList.remove('syncing');
                syncStatus.classList.add('error');
                syncStatus.title = 'Sync failed - using local data';
            }
            throw error;
        }
    }

    loadLocalData() {
        // Load data from localStorage when offline
        this.data = this.loadData();
        this.updateDisplay();
        this.updateProgress();
        this.updateCurrentStreak();
        this.updateAchievements();
        this.updateScheduledHabits();
    }

    // Override saveData to also save to Firestore when online
    saveData() {
        localStorage.setItem('lifeGamifierData', JSON.stringify(this.data));
        if (this.isOnline && this.user) {
            // Save to cloud asynchronously without blocking UI
            this.saveUserDataToFirestore().catch(error => {
                console.error('Failed to sync to cloud:', error);
                // Don't show error to user for every save - it's not critical
            });
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.lifeGamifier = new LifeGamifier();
});

// Global function for habit buttons
function toggleHabit(habitName) {
    window.lifeGamifier.toggleHabit(habitName);
}

function markRestDay(habitName) {
    window.lifeGamifier.markRestDay(habitName);
}

// Modal functions
function showAddHabitModal() {
    document.getElementById('addHabitModal').style.display = 'block';
    document.getElementById('habitName').focus();
}

function hideAddHabitModal() {
    document.getElementById('addHabitModal').style.display = 'none';
    document.getElementById('addHabitForm').reset();
}

function addCustomHabit(event) {
    event.preventDefault();
    
    const name = document.getElementById('habitName').value.trim();
    const description = document.getElementById('habitDescription').value.trim();
    const icon = document.getElementById('habitIcon').value;
    const category = document.getElementById('habitCategory').value;
    const reminderTime = document.getElementById('habitTime').value;
    const enableNotifications = document.getElementById('enableNotifications').checked;
    
    if (name) {
        window.lifeGamifier.addCustomHabit(name, description, icon, category, reminderTime, enableNotifications);
        hideAddHabitModal();
    }
}

function deleteCustomHabit(habitId) {
    window.lifeGamifier.deleteCustomHabit(habitId);
}

function requestNotificationPermission() {
    window.lifeGamifier.requestNotificationPermission();
}

function disableNotifications() {
    if (confirm('Are you sure you want to disable notifications? You won\'t receive reminders for your scheduled habits.')) {
        window.lifeGamifier.data.notificationsEnabled = false;
        window.lifeGamifier.saveData();
        window.lifeGamifier.updateNotificationStatus();
        window.lifeGamifier.showNotification('Notifications disabled', 'info');
    }
}

function addHabitSchedule() {
    const habitId = document.getElementById('scheduleHabitSelect').value;
    const time = document.getElementById('scheduleTime').value;
    
    if (!habitId) {
        window.lifeGamifier.showNotification('Please select a habit to schedule', 'info');
        return;
    }
    
    if (!time) {
        window.lifeGamifier.showNotification('Please set a reminder time', 'info');
        return;
    }
    
    if (!window.lifeGamifier.data.notificationsEnabled) {
        window.lifeGamifier.showNotification('Please enable notifications first', 'info');
        return;
    }
    
    const habitData = window.lifeGamifier.getHabitData(habitId);
    if (habitData) {
        window.lifeGamifier.data.scheduledHabits[habitId] = {
            time: time,
            enabled: true
        };
        window.lifeGamifier.scheduleNotification(habitId, time);
        window.lifeGamifier.saveData();
        window.lifeGamifier.updateScheduledHabits();
        window.lifeGamifier.showNotification(`Scheduled ${habitData.name} for ${window.lifeGamifier.formatTime(time)}`, 'success');
        
        // Clear the form
        document.getElementById('scheduleHabitSelect').value = '';
        document.getElementById('scheduleTime').value = '';
    }
}

function editHabitSchedule(habitId) {
    const habitData = window.lifeGamifier.getHabitData(habitId);
    const scheduleData = window.lifeGamifier.data.scheduledHabits[habitId];
    
    if (habitData && scheduleData) {
        const newTime = prompt(`Enter new time for ${habitData.name} (HH:MM format):`, scheduleData.time);
        if (newTime && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(newTime)) {
            scheduleData.time = newTime;
            window.lifeGamifier.saveData();
            window.lifeGamifier.updateScheduledHabits();
            window.lifeGamifier.showNotification(`Updated schedule for ${habitData.name}`, 'success');
        } else if (newTime) {
            window.lifeGamifier.showNotification('Invalid time format. Please use HH:MM (e.g., 09:30)', 'info');
        }
    }
}

function removeHabitSchedule(habitId) {
    const habitData = window.lifeGamifier.getHabitData(habitId);
    if (habitData && confirm(`Remove schedule for ${habitData.name}?`)) {
        delete window.lifeGamifier.data.scheduledHabits[habitId];
        window.lifeGamifier.saveData();
        window.lifeGamifier.updateScheduledHabits();
        window.lifeGamifier.showNotification(`Removed schedule for ${habitData.name}`, 'info');
    }
}

// Firebase Authentication Functions
async function loginWithGoogle() {
    if (!window.firebaseSignIn || !window.firebaseAuth || !window.firebaseProvider) {
        window.lifeGamifier.showNotification('Firebase not loaded. Please refresh the page.', 'info');
        return;
    }

    try {
        const result = await window.firebaseSignIn(window.firebaseAuth, window.firebaseProvider);
        window.lifeGamifier.showNotification(`Welcome, ${result.user.displayName}!`, 'success');
    } catch (error) {
        console.error('Login error:', error);
        if (error.code === 'auth/popup-closed-by-user') {
            window.lifeGamifier.showNotification('Login cancelled', 'info');
        } else {
            window.lifeGamifier.showNotification('Login failed. Please try again.', 'info');
        }
    }
}

async function logout() {
    if (!window.firebaseSignOut || !window.firebaseAuth) {
        window.lifeGamifier.showNotification('Firebase not loaded. Please refresh the page.', 'info');
        return;
    }

    try {
        await window.firebaseSignOut(window.firebaseAuth);
        window.lifeGamifier.showNotification('Logged out successfully', 'info');
    } catch (error) {
        console.error('Logout error:', error);
        window.lifeGamifier.showNotification('Logout failed. Please try again.', 'info');
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('addHabitModal');
    if (e.target === modal) {
        hideAddHabitModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        hideAddHabitModal();
    }
});

// Add some keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case '1':
                e.preventDefault();
                toggleHabit('sleep');
                break;
            case '2':
                e.preventDefault();
                toggleHabit('gym');
                break;
            case '3':
                e.preventDefault();
                toggleHabit('run');
                break;
            case '4':
                e.preventDefault();
                toggleHabit('screen');
                break;
        }
    }
});

// Add service worker for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
