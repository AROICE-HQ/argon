<div align="center">

![ARGON Logo](icons/icon-128.png)

# 🛡️ ARGON: Your Shield Against Chaos

[![Version](https://img.shields.io/badge/version-0.1.3-blue.svg)](https://github.com/aroice-hq/argon)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Coming%20Soon-orange.svg)](https://chromewebstore.google.com/)
[![Product Hunt](https://img.shields.io/badge/Product%20Hunt-Launch%20Soon-ff6154.svg)](https://www.producthunt.com/products/argon)

*Reclaim your focus. Master your time. Transform your digital life.*

</div>

> A powerful productivity Chrome extension designed to enhance your digital habits and protect you from online distractions. Take control of your browsing experience with intelligent website blocking, screen time analytics, and digital wellbeing tools.

## 🌟 Features

### 🚫 **Website Blocking**
- **Smart Site Blocking**: Block distracting websites with custom domain filtering
- **Temporary Access**: Allow blocked sites for limited time periods (5 minutes)
- **Instant Blocking**: Real-time protection as you browse
- **Enhanced Block Page**: Motivational quotes and productivity stats when sites are blocked

### 📊 **Screen Time Analytics**
- **Daily Tracking**: Monitor your screen time with minute-by-minute precision
- **Top Site-Specific Stats**: See time spent on individual websites
- **Weekly Overview**: Historical data with charts
- **Top Sites**: Track your most visited websites
- **Hourly Breakdown**: Hourly usage patterns

### 💀 **Doom Scroll Blocker**
- **Intelligent Detection**: Automatically detects excessive scrolling behavior
- **Social Media Protection**: Pre-configured protection for major social platforms
- **Custom Site Support**: Add any website to doom scroll protection
- **Intervention Overlay**: Gentle reminders to break scrolling habits
- **Statistics Tracking**: Monitor your doom scrolling interventions

### 🍅 **Pomodoro Timer**
- **Customizable Sessions**: Configure work/break durations
- **Visual Progress**: Circular progress indicator with smooth animations
- **Session Management**: Track completed pomodoro sessions
- **Auto-start Options**: Automatic break and work session transitions
- **Focus Statistics**: Monitor your productivity patterns

### 🏥 **Digital Wellbeing & Health Reminders**
- **Posture Reminders**: Regular prompts to check your posture
- **Hydration Alerts**: Stay hydrated with water break reminders
- **Eye Care (20-20-20 Rule)**: Protect your eyes with regular break reminders
- **Movement Breaks**: Encouragement to take walking breaks
- **Breathing Exercises**: Stress-relief breathing reminders
- **Screen Break Alerts**: Regular screen break notifications
- **Customizable Intervals**: Set reminder frequencies that work for you

### 🎨 **Modern User Experience**
- **Clean Dashboard**: Comprehensive analytics and management interface
- **Smooth Animations**: Polished UI with engaging micro-interactions
- **Dark Theme**: Easy on the eyes with a modern dark interface

## 🚀 Installation

### From Chrome Web Store (Coming Soon)
1. Visit the [Chrome Web Store page](https://chromewebstore.google.com/) (link coming soon, this month)
2. Click "Add to Chrome"
3. Confirm the installation
4. Pin the extension to your toolbar for easy access

### Developer Installation
1. Clone this repository:
   ```bash
   git clone https://github.com/aroice-hq/argon.git
   cd argon
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" in the top right corner

4. Click "Load unpacked" and select the project folder

5. The ARGON extension will appear in your extensions list

## 🎯 Quick Start

### First Setup
1. **Click the ARGON icon** in your Chrome toolbar
2. **Add sites to block** by clicking "Block Site" or visiting the dashboard
3. **Configure settings** in the comprehensive dashboard
4. **Set up health reminders** for better digital wellbeing
5. **Start using the Pomodoro timer** for focused work sessions

### Daily Usage
- **Monitor screen time** through the popup or dashboard
- **Use temporary access** when you need to visit blocked sites briefly
- **Check your productivity stats** to stay motivated
- **Let health reminders** guide you to better digital habits

## 📱 User Interface

### Extension Popup
- **Quick Stats**: Today's screen time, blocks, and site count
- **Action Buttons**: Block current site, access analytics
- **Timer Display**: Shows temporary access countdown when active
- **Clean Design**: Minimalist interface for quick interactions

### Comprehensive Dashboard
- **Analytics Page**: Interactive charts and detailed statistics
- **Blocked Sites Management**: Add, remove, and organize blocked sites
- **Pomodoro Timer**: Full-featured productivity timer
- **Doom Scroll Blocker**: Manage social media protection
- **Health Reminders**: Configure digital wellbeing alerts

## 🛠️ Technical Details

### Architecture
- **Manifest V3**: Built with the latest Chrome extension standards
- **Modular Design**: Clean separation of concerns with dedicated modules
- **Service Worker**: Efficient background processing
- **Local Storage**: Secure data storage with Chrome's storage API

### Key Technologies
- **HTML5 & CSS3**: Modern web standards with responsive design
- **Vanilla JavaScript**: No external dependencies for core functionality
- **Chart.js**: Interactive data visualizations
- **Font Awesome**: Comprehensive icon library
- **Chrome Extensions API**: Full integration with browser capabilities

### Permissions Required
- `storage` - Store user preferences and statistics
- `webNavigation` - Monitor and block website navigation
- `tabs` - Access current tab information
- `alarms` - Schedule reminders and time tracking
- `notifications` - Display health and productivity reminders
- `scripting` - Inject doom scroll detection scripts

## 🔧 Configuration

### Website Blocking
```javascript
// Add sites programmatically
chrome.runtime.sendMessage({
  action: 'addBlockedSite',
  site: 'example.com'
});
```

### Health Reminders
- **Posture Check**: Every 30 minutes (customizable)
- **Hydration**: Every 45 minutes (customizable)
- **Eye Breaks**: Every 20 minutes (20-20-20 rule)
- **Movement**: Every 60 minutes (customizable)
- **Breathing**: Every 90 minutes (customizable)

### Pomodoro Settings
- **Work Duration**: 25 minutes (default, customizable)
- **Short Break**: 5 minutes (default, customizable)
- **Long Break**: 15 minutes (default, customizable)
- **Sessions Until Long Break**: 4 (customizable)

## 📊 Data & Privacy

### Data Collection
ARGON prioritizes your privacy:
- **Local Storage Only**: All data stays on your device
- **No External Servers**: No data transmitted to external services
- **No Tracking**: No user behavior tracking or analytics
- **No Ads**: Completely ad-free experience

### Data Types Stored
- Website blocking preferences
- Screen time statistics
- Pomodoro session history
- Health reminder settings
- UI preferences and customizations

## 🎨 Features Showcase

### Screen Time Analytics

![Screen Time Analytics Dashboard](/media/Screenshots/1%20Screen%20Time%20.png)


### Health Reminders (via system notifications)

![Digital Wellbeing Dashboard](/media/Screenshots/6%20Health%20Reminders.png)

## 🤝 Contributing

We welcome contributions! 
Here's how you can help:

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Areas for Contribution
- 🐛 **Bug Fixes**: Help us squash bugs & improve stability
- ✨ **New Features**: Suggest and implement new productivity tools
- 🎨 **UI/UX Improvements**: Enhance the user experience
- 📖 **Documentation**: Improve docs and add tutorials
- 🌐 **Localization**: Translate the extension to other languages
- 🧪 **Testing**: Add tests and improve code coverage

📚 **Learn more about contribution guidelines and how to get started:** [Contributing Guide](CONTRIBUTING.md)

## 🐛 Bug Reports & Feature Requests

### Reporting Bugs
Found a bug? Please help us fix it:
1. Check existing [issues](https://github.com/aroice-hq/argon/issues) first
2. Create a detailed bug report with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Chrome version and OS
   - Screenshots if applicable

### Feature Requests
Have an idea? We'd love to hear it:
1. Check if it's already suggested in [issues](https://github.com/aroice-hq/argon/issues)
2. Create a feature request with:
   - Clear description of the feature
   - Use case and benefits
   - Any implementation ideas

## 📋 Roadmap

### Version 0.2.0 (Coming Soon)
- [ ] **Enhanced Scheduling**: Time-based blocking rules
- [ ] **Focus Modes**: Predefined productivity profiles
- [ ] **Export Data**: Backup and restore functionality
- [ ] **Advanced Analytics**: Monthly and yearly insights
- [ ] **Team Features**: Shared blocking lists and challenges

### Version 0.xx.xxx (Future)
- [ ] **Cross-Browser Support**: Firefox and Edge compatibility
- [ ] **Mobile Integration**: Companion mobile app
- [ ] **AI Insights**: Intelligent productivity recommendations
- [ ] **Social Features**: Share achievements and compete with friends
- [ ] **Integration APIs**: Connect with other productivity tools

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Aryan Techie** ([Aryan Jangra](https://aryan.aroice.in))
- 🌐 Website: [aryan.aroice.in](https://aryan.aroice.in)
- 📧 Email: [aryan@aroice.in](mailto:aryan@aroice.in)
- 🐙 GitHub: [@Aryan-Techie](https://github.com/Aryan-Techie)
- 🏢 Organization: [AROICE](https://aroice.in)

## 🙏 Acknowledgments

- **Chart.js** - For beautiful data visualizations
- **Font Awesome** - For the comprehensive icon library
- **Chrome Extensions Team** - For the powerful extension platform
- **Open Source Community** - For inspiration and best practices

## 🔗 Related Projects

- **[Ashes New Tab](https://ashes.aroice.in)** - Transform your new tab into a productivity powerhouse
- **Must-Have Chrome Extensions** - Curated list of essential browser extensions

## 📢 Stay Connected

- 🌐 **Project Homepage**: [argon.aroice.in](https://argon.aroice.in)
- 📊 **Analytics Dashboard**: Built-in comprehensive dashboard
- 🚀 **Product Hunt**: [Follow our launch](https://www.producthunt.com/) (launching soon)
- 🆘 **Support**: [admin@aroice.in](mailto:admin@aroice.in)
- 🐛 **Issues**: [GitHub Issues](https://github.com/aroice-hq/argon/issues)

---

<div align="center">

**Made with ❤️ by [AROICE](https://github.com/aroice-hq)**

*Building tools for a better digital future.*

</div>