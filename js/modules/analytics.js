/**
 * Analytics Module - Handles screen time analytics, charts, and statistics
 */
class AnalyticsManager {
    constructor() {
        // Chart variables
        this.currentChartPeriod = 'daily';
        this.chartCanvas = null;
        this.chartContext = null;
    }

    /**
     * Initialize analytics functionality
     */
    init() {
        this.loadStats();
        this.initChart();
    }

    /**
     * Load statistics data
     */
    loadStats() {
        // Add loading skeleton to stats cards
        const statCards = document.querySelectorAll('.stat-card, .analytics-card');
        statCards.forEach(card => card.classList.add('loading-skeleton'));
        
        // Get screen time stats
        chrome.storage.local.get(['screenTimeData', 'blockCounts', 'blockedSites'], (data) => {
            let screenTimeData = data.screenTimeData || {};
            const blockCounts = data.blockCounts || {};
            const blockedSites = data.blockedSites || [];

            // Use test data if no real data exists
            if (this.shouldUseTestData(screenTimeData)) {
                console.log('No real data found, using test data for demo');
                screenTimeData = this.generateTestData();
            }

            // Calculate total screen time for today
            const hourlyData = screenTimeData.hourlyData || {};
            let todaySeconds = 0;
            Object.values(hourlyData).forEach(seconds => {
                todaySeconds += seconds || 0;
            });

            // Calculate weekly screen time
            const weeklyHistory = screenTimeData.weeklyHistory || {};
            let weekSeconds = todaySeconds; // Start with today
            const today = new Date();
            for (let i = 1; i < 7; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dayKey = date.toDateString();
                weekSeconds += weeklyHistory[dayKey] || 0;
            }

            // Calculate distracting time (time spent on blocked sites)
            const siteTracking = screenTimeData.siteTracking || {};
            let distractingSeconds = 0;
            Object.entries(siteTracking).forEach(([hostname, siteData]) => {
                if (blockedSites.includes(hostname)) {
                    distractingSeconds += siteData.todaySeconds || 0;
                }
            });

            // Update statistics cards with correct IDs
            const screenTimeTodayEl = document.getElementById('screen-time-today');
            const screenTimeWeekEl = document.getElementById('screen-time-week');
            const distractingTimeEl = document.getElementById('distracting-time');

            if (screenTimeTodayEl) {
                screenTimeTodayEl.textContent = this.formatTime(todaySeconds);
            }
            if (screenTimeWeekEl) {
                screenTimeWeekEl.textContent = this.formatTime(weekSeconds);
            }
            if (distractingTimeEl) {
                distractingTimeEl.textContent = this.formatTime(distractingSeconds);
            }

            // Remove loading skeleton
            statCards.forEach(card => card.classList.remove('loading-skeleton'));

            // Load top sites and chart data
            this.loadMockTopSites(screenTimeData);
            this.loadChartData(screenTimeData);
        });
    }

    /**
     * Format time in seconds to a readable format
     * @param {number} seconds - Time in seconds
     * @returns {string} - Formatted time string
     */
    formatTime(seconds) {
        // Handle invalid values
        if (seconds === undefined || seconds === null || isNaN(seconds)) {
            return '0 min';
        }
        
        if (seconds < 60) return `${seconds} sec`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (minutes === 0) return `${hours} hr`;
        return `${hours} hr ${minutes} min`;
    }

    /**
     * Initialize the screen time chart
     */
    initChart() {
        this.chartCanvas = document.getElementById('screenTimeChart');
        if (!this.chartCanvas) return;

        this.chartContext = this.chartCanvas.getContext('2d');
        
        // Set canvas resolution
        const rect = this.chartCanvas.getBoundingClientRect();
        this.chartCanvas.width = rect.width * window.devicePixelRatio;
        this.chartCanvas.height = rect.height * window.devicePixelRatio;
        this.chartContext.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        // Add toggle button event listeners
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');
                
                // Update chart period
                this.currentChartPeriod = btn.dataset.period;
                this.loadChartData(); // Load from storage when toggling
            });
        });
        
        // Load initial chart data
        this.loadChartData();
    }

    /**
     * Load and display chart data based on current period
     */
    loadChartData(screenTimeData = null) {
        if (screenTimeData) {
            // Use provided data
            if (this.currentChartPeriod === 'daily') {
                this.loadDailyChartData(screenTimeData);
            } else {
                this.loadWeeklyChartData(screenTimeData);
            }
        } else {
            // Load from storage
            chrome.storage.local.get(['screenTimeData'], (data) => {
                let screenTimeData = data.screenTimeData || {};
                
                // Use test data if no real data exists
                if (this.shouldUseTestData(screenTimeData)) {
                    screenTimeData = this.generateTestData();
                }
                
                if (this.currentChartPeriod === 'daily') {
                    this.loadDailyChartData(screenTimeData);
                } else {
                    this.loadWeeklyChartData(screenTimeData);
                }
            });
        }
    }

    /**
     * Load daily chart data (hourly breakdown)
     */
    loadDailyChartData(screenTimeData) {
        const hourlyData = screenTimeData.hourlyData || {};
        const currentHour = new Date().getHours();
        
        const labels = [];
        const values = [];
        let totalSeconds = 0;
        
        // Generate hourly data
        for (let hour = 0; hour <= currentHour; hour++) {
            const hourKey = hour.toString().padStart(2, '0');
            const seconds = hourlyData[hourKey] || 0;
            
            // Format hour labels
            const timeLabel = hour === 0 ? '12 AM' : 
                            hour < 12 ? `${hour} AM` :
                            hour === 12 ? '12 PM' : `${hour - 12} PM`;
            
            labels.push(timeLabel);
            values.push(Math.round(seconds / 60)); // Convert to minutes
            totalSeconds += seconds;
        }
        
        // Only show real data - no fake data generation
        this.drawChart(labels, values, 'Minutes', totalSeconds);
        this.updateChartStats(totalSeconds, values.length, 'daily');
        
        // Debug: Log to verify consistency with stats
        console.log('Daily chart calculation:', {
            hourlyData: hourlyData,
            totalSeconds: totalSeconds,
            totalFormatted: this.formatTime(totalSeconds),
            labels: labels,
            values: values
        });
    }

    /**
     * Load weekly chart data (daily breakdown)
     */
    loadWeeklyChartData(screenTimeData) {
        const weeklyHistory = screenTimeData.weeklyHistory || {};
        
        // Calculate today's seconds from hourlyData (same as stats)
        const hourlyData = screenTimeData.hourlyData || {};
        let todaySeconds = 0;
        Object.values(hourlyData).forEach(seconds => {
            todaySeconds += seconds || 0;
        });
        
        const labels = [];
        const values = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        let totalSeconds = 0;
        
        // Generate last 7 days of data
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            const dayName = dayNames[date.getDay()];
            const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
            
            labels.push(`${dayName}\n${dateStr}`);
            
            if (i === 0) {
                // Today's data from hourly tracking
                values.push(Math.round(todaySeconds / 3600)); // Convert to hours
                totalSeconds += todaySeconds;
            } else {
                // Previous days from weekly history
                const dayKey = date.toDateString();
                const daySeconds = weeklyHistory[dayKey] || 0;
                values.push(Math.round(daySeconds / 3600)); // Convert to hours
                totalSeconds += daySeconds;
            }
        }
        
        // Only show real data - no fake data generation
        this.drawChart(labels, values, 'Hours', totalSeconds);
        this.updateChartStats(totalSeconds, values.length, 'weekly');
    }

    /**
     * Draw the chart with given data
     */
    drawChart(labels, values, unit, totalSeconds) {
        if (!this.chartContext) return;
        
        const canvas = this.chartCanvas;
        const ctx = this.chartContext;
        const rect = canvas.getBoundingClientRect();
        
        // Clear canvas
        ctx.clearRect(0, 0, rect.width, rect.height);
        
        // Check if there's any real data
        const hasData = totalSeconds > 0;
        
        if (!hasData) {
            // Show "No data available" message
            ctx.fillStyle = '#a7b0c0';
            ctx.font = '16px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No data available yet', rect.width / 2, rect.height / 2);
            
            ctx.font = '14px Inter, sans-serif';
            ctx.fillStyle = '#64748b';
            const message = this.currentChartPeriod === 'daily' ? 
                'Start browsing to see hourly screen time data' : 
                'Use the extension for a few days to see weekly trends';
            ctx.fillText(message, rect.width / 2, rect.height / 2 + 25);
            return;
        }
        
        // Chart dimensions
        const padding = { top: 30, right: 30, bottom: 60, left: 50 };
        const chartWidth = rect.width - padding.left - padding.right;
        const chartHeight = rect.height - padding.top - padding.bottom;
        
        // Find max value for scaling
        const maxValue = Math.max(...values, 1);
        const yScale = chartHeight / maxValue;
        
        // Bar dimensions
        const barWidth = chartWidth / labels.length;
        const barMaxWidth = barWidth * 0.7;
        const barPadding = (barWidth - barMaxWidth) / 2;
        
        // Draw grid lines
        ctx.strokeStyle = '#3a4255';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        
        const gridSteps = 5;
        for (let i = 0; i <= gridSteps; i++) {
            const y = padding.top + (chartHeight / gridSteps) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + chartWidth, y);
            ctx.stroke();
        }
        ctx.setLineDash([]);
        
        // Draw bars
        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
        gradient.addColorStop(0, '#4f8cff');
        gradient.addColorStop(1, '#3b7ce8');
        
        values.forEach((value, index) => {
            const barHeight = value * yScale;
            const x = padding.left + index * barWidth + barPadding;
            const y = padding.top + chartHeight - barHeight;
            
            // Draw bar
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barMaxWidth, barHeight);
            
            // Draw value label on top of bar
            if (value > 0) {
                ctx.fillStyle = '#a7b0c0';
                ctx.font = '10px Inter, sans-serif';
                ctx.textAlign = 'center';
                const label = unit === 'Hours' ? `${value}h` : `${value}m`;
                ctx.fillText(label, x + barMaxWidth / 2, y - 5);
            }
        });
        
        // Draw X-axis labels
        ctx.fillStyle = '#a7b0c0';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        
        labels.forEach((label, index) => {
            const x = padding.left + index * barWidth + barWidth / 2;
            const lines = label.split('\n');
            
            lines.forEach((line, lineIndex) => {
                const y = padding.top + chartHeight + 20 + (lineIndex * 12);
                ctx.fillText(line, x, y);
            });
        });
        
        // Draw Y-axis labels
        ctx.textAlign = 'right';
        for (let i = 0; i <= gridSteps; i++) {
            const value = Math.round((maxValue / gridSteps) * (gridSteps - i));
            const y = padding.top + (chartHeight / gridSteps) * i + 4;
            const label = unit === 'Hours' ? `${value}h` : `${value}m`;
            ctx.fillText(label, padding.left - 10, y);
        }
    }

    /**
     * Update chart statistics display
     */
    updateChartStats(totalSeconds, dataPoints, period) {
        const totalElement = document.getElementById('chart-total');
        const avgElement = document.getElementById('chart-average');
        
        if (totalElement) {
            if (totalSeconds > 0) {
                totalElement.textContent = this.formatTime(totalSeconds);
            } else {
                totalElement.textContent = 'No data';
            }
        }
        
        if (avgElement) {
            if (totalSeconds > 0) {
                const avgSeconds = Math.round(totalSeconds / dataPoints);
                avgElement.textContent = this.formatTime(avgSeconds);
            } else {
                avgElement.textContent = 'No data';
            }
        }
    }

    /**
     * Load real top sites data from tracking
     */
    loadMockTopSites(screenTimeData = null) {
        if (screenTimeData) {
            // Use provided data
            this.renderTopSites(screenTimeData);
        } else {
            // Load from storage
            chrome.storage.local.get(['screenTimeData'], (data) => {
                let screenTimeData = data.screenTimeData || {};
                
                // Use test data if no real data exists
                if (this.shouldUseTestData(screenTimeData)) {
                    screenTimeData = this.generateTestData();
                }
                
                this.renderTopSites(screenTimeData);
            });
        }
    }

    /**
     * Render top sites from screen time data
     */
    renderTopSites(screenTimeData) {
        const siteTracking = screenTimeData.siteTracking || {};
        
        // Convert to array and sort by time
        const topSites = Object.entries(siteTracking)
            .map(([hostname, siteData]) => ({
                name: hostname,
                icon: siteData.favicon || `https://www.google.com/s2/favicons?domain=${hostname}`,
                time: siteData.todaySeconds || 0
            }))
            .sort((a, b) => b.time - a.time)
            .slice(0, 5); // Get top 5 sites
        
        const topSitesContainer = document.getElementById('top-sites');
        if (!topSitesContainer) return;
        
        topSitesContainer.innerHTML = '';
        
        if (topSites.length === 0) {
            topSitesContainer.innerHTML = `
                <div class="empty-state">
                    <p>No site data available yet.</p>
                    <p>Start browsing to see your top sites.</p>
                </div>
            `;
            return;
        }
        
        topSites.forEach(site => {
            const siteElement = document.createElement('div');
            siteElement.className = 'site-item';
            siteElement.innerHTML = `
                <div class="site-info">
                    <img src="${site.icon}" alt="${site.name}" onerror="this.src='icons/icon-16.png'">
                    <span>${site.name}</span>
                </div>
                <div class="site-time">${this.formatTime(site.time)}</div>
            `;
            topSitesContainer.appendChild(siteElement);
        });
    }

    /**
     * Refresh analytics data
     */
    async refreshData() {
        this.loadStats();
        this.loadChartData();
    }

    /**
     * Generate test data for development/demo purposes
     */
    generateTestData() {
        const testData = {
            hourlyData: {},
            weeklyHistory: {},
            siteTracking: {
                'youtube.com': { todaySeconds: 3600, favicon: 'https://www.google.com/s2/favicons?domain=youtube.com' },
                'facebook.com': { todaySeconds: 2400, favicon: 'https://www.google.com/s2/favicons?domain=facebook.com' },
                'twitter.com': { todaySeconds: 1800, favicon: 'https://www.google.com/s2/favicons?domain=twitter.com' },
                'reddit.com': { todaySeconds: 1200, favicon: 'https://www.google.com/s2/favicons?domain=reddit.com' },
                'instagram.com': { todaySeconds: 900, favicon: 'https://www.google.com/s2/favicons?domain=instagram.com' }
            }
        };

        // Generate hourly data for today
        const currentHour = new Date().getHours();
        for (let hour = 0; hour <= currentHour; hour++) {
            const hourKey = hour.toString().padStart(2, '0');
            testData.hourlyData[hourKey] = Math.floor(Math.random() * 3600); // 0-60 minutes
        }

        // Generate weekly history
        const today = new Date();
        for (let i = 1; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dayKey = date.toDateString();
            testData.weeklyHistory[dayKey] = Math.floor(Math.random() * 28800); // 0-8 hours
        }

        return testData;
    }

    /**
     * Check if we should use test data (when no real data exists)
     */
    shouldUseTestData(screenTimeData) {
        const hourlyData = screenTimeData.hourlyData || {};
        const hasHourlyData = Object.keys(hourlyData).length > 0;
        const hasSiteData = Object.keys(screenTimeData.siteTracking || {}).length > 0;
        
        return !hasHourlyData && !hasSiteData;
    }
}

// Export for use in main dashboard
window.AnalyticsManager = AnalyticsManager;
