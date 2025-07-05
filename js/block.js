/**
 * ARGON - The Block Page Script
 * 
 * This is the page that shows up when a user tries to visit a blocked site
 * 
 * Basically our "nope, you can't go there" page with some motivation quotes
 */

document.addEventListener('DOMContentLoaded', () => {
    // getting all the HTML elements we need to work with
    const siteUrlElement = document.getElementById('site-url');
    const blockCountElement = document.getElementById('block-count');
    const timeSavedElement = document.getElementById('time-saved');
    const goBackBtn = document.getElementById('go-back-btn');
    const allowOnceBtn = document.getElementById('allow-once-btn');

    // Figure out which website got blocked (gets from the URL parameter)
    const urlParams = new URLSearchParams(window.location.search);
    const blockedUrl = urlParams.get('blocked');
    
    // If we actually got a blocked URL, this is whats gonna show up as message
    if (blockedUrl) {
        try {
            const url = new URL(blockedUrl);
            siteUrlElement.textContent = `${url.hostname} has been blocked to maintain your focus.`;
        } catch (error) {
            console.error('Error parsing URL:', error);
        }
    }

    /**
     * This is how we setup the block page with all the data and a nice quote
     */
    async function initBlockPage() {
        // Get all the data we've stored about blocks and screen time from the chrome local storage
        const data = await chrome.storage.local.get(['blockCounts', 'screenTimeData']);
        
        // this counts up how many times we've blocked websites
        const blockCounts = data.blockCounts || {};

        // this will add up all the blocks from different websites
        const totalBlocks = Object.values(blockCounts).reduce((sum, count) => sum + count, 0);
        blockCountElement.textContent = totalBlocks;
        
        // for now assume each block saved 5 minutes (yup, just a guess, to take 5 minutes per site, will change/ imporve this method in future updates, but for now 5 minutes/website block)
        const minutesSaved = totalBlocks * 5;

        timeSavedElement.textContent = formatTime(minutesSaved * 60); // function to convert to seconds
        

        // this shows a random quote to make user feel better about being blocked.
        // like why not :)
        updateMotivationalQuote();
    }

    /**
     * This takes seconds and makes them look nice (like "5 min" instead of "300 seconds")
     * 
     * Because nobody wants to see "you saved 18000 seconds" - that's just confusing (i guess)
     * 
     * @param {number} seconds - How many seconds to format
     * @returns {string} - Nice looking time like "2 hr 30 min"
     */
    function formatTime(seconds) {
        if (seconds < 60) return `${seconds} sec`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (minutes === 0) return `${hours} hr`;
        return `${hours} hr ${minutes} min`;
    }

    /**
     * Picks a random quote to show on the block page
     * 
     * Maybe the user will actually feel good about being productive... just maybe :)
     */
    function updateMotivationalQuote() {
        const quotes = [
            // list of quotes
            "Focus on being productive, not busy.",
            "Your focus determines your reality.",
            "Concentration is the secret of strength.",
            "Discipline is choosing between what you want now and what you want most.",
            "The successful warrior is the average person with laser-like focus.",
            "It's not about having time, it's about making time.",
            "The secret of getting ahead is getting started.",
            "Done is better than perfect.",
            "The hardest part of any task is starting it.",
            "What gets measured gets managed.",
            "The future depends on what you do today.",
            "Distraction is the enemy of vision.",
            "Stay focused and never give up.",
            "Focus like a laser, not like a flashlight.",
            "Your attention is your most valuable asset.",
            "Guard your focus like you guard your wallet.",
            "Deep work produces deep results.",
            "Single-tasking is the new multitasking.",
            "Focused attention is the gateway to peak performance.",
            "The depth of your focus determines the height of your success.",
            "Eliminate distractions or they will eliminate your dreams.",
            "A focused mind is an unstoppable force.",
            "Focus is not about doing more, it's about doing what matters.",
            "Where attention goes, energy flows and results show.",
            "The ability to focus is your superpower in a distracted world.",
            "Protect your focus like your life depends on it.",
            "Focus is the bridge between goals and achievement.",
            "In a world full of distractions, focus is your competitive advantage.",
            "The focused few outperform the distracted many.",
            "Your focus creates your reality, choose wisely.",
            "Deep focus beats shallow work every time.",
            "Focus is saying no to 1000 good ideas.",
            "The art of being wise is knowing what to overlook.",
            "Clarity comes from focus, confusion comes from distraction.",
            "Focus on the step in front of you, not the whole staircase.",
            "A scattered focus yields scattered results.",
            "The power of focus can move mountains.",
            "Focus transforms ordinary into extraordinary.",
            "Your future is created by what you focus on today.",
            "Master your focus, master your life."

        ];
        
        // this picks a random quote from the above quotes list
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        
        // puts the quote on block page with quotation marks
        const motivationElement = document.querySelector('.motivation p');
        if (motivationElement) {
            motivationElement.textContent = `"${randomQuote}"`;
        }
    }

    /**
     * What happens when someone clicks "Go Back" 
     * 
     * it will send them back them on Google Homepage
     * i know not the best way (will improve this in future updates)
     */
    
    goBackBtn.addEventListener('click', () => {
        const referrer = document.referrer;
        
        // If there's a referrer from an external site, go there
        if (referrer && !referrer.includes(window.location.hostname)) {
            window.location.href = referrer;
        } 
        // If no external referrer (direct visit), go to Google
        else {
            window.location.href = 'https://google.com';
        }
    });

    /**
     * What happens when someone clicks "Allow Once"
     * Basically a "please just let me procrastinate for 5 minutes" button
     * 
     * or for the cases when something really important comes up.
     */
    allowOnceBtn.addEventListener('click', async () => {
        if (!blockedUrl) return;
        try {
            // Tell the background script to allow this site for a bit
            // We send the full URL because just the domain isn't specific enough
            chrome.runtime.sendMessage({
                action: 'allowSiteTemporarily',
                url: blockedUrl,
                duration: 5 * 60 * 1000 // 5 minutes in milliseconds
            }, (response) => {
                if (response && response.success) {
                    // Cool, it worked! Send them to the site they wanted
                    window.location.href = blockedUrl;
                } else {
                    console.error('Failed to allow site temporarily');
                }
            });
        } catch (error) {
            console.error('Error allowing site temporarily:', error);
        }
    });

    // Start everything up when the page loads
    initBlockPage();
});
