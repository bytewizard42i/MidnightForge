import React, { useState, useEffect } from 'react';
import styles from './DeploymentModal.module.css';

interface DeploymentModalProps {
  isOpen: boolean;
  deploymentStatus: string;
}

const inspirationalQuotes = [
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt"
  },
  {
    text: "Innovation distinguishes between a leader and a follower.",
    author: "Steve Jobs"
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs"
  },
  {
    text: "Code is poetry written in logic.",
    author: "Anonymous"
  },
  {
    text: "The best time to plant a tree was 20 years ago. The second best time is now.",
    author: "Chinese Proverb"
  },
  {
    text: "Your limitation—it's only your imagination.",
    author: "Anonymous"
  },
  {
    text: "Great things never come from comfort zones.",
    author: "Anonymous"
  },
  {
    text: "Dream it. Wish it. Do it.",
    author: "Anonymous"
  },
  {
    text: "Success doesn't just find you. You have to go out and get it.",
    author: "Anonymous"
  },
  {
    text: "The harder you work for something, the greater you'll feel when you achieve it.",
    author: "Anonymous"
  },
  {
    text: "Dream bigger. Do bigger.",
    author: "Anonymous"
  },
  {
    text: "Don't stop when you're tired. Stop when you're done.",
    author: "Anonymous"
  },
  {
    text: "Wake up with determination. Go to bed with satisfaction.",
    author: "Anonymous"
  },
  {
    text: "Do something today that your future self will thank you for.",
    author: "Sean Patrick Flanery"
  },
  {
    text: "Little things make big days.",
    author: "Anonymous"
  },
  {
    text: "It's going to be hard, but hard does not mean impossible.",
    author: "Anonymous"
  },
  {
    text: "Don't wait for opportunity. Create it.",
    author: "Anonymous"
  },
  {
    text: "Sometimes we're tested not to show our weaknesses, but to discover our strengths.",
    author: "Anonymous"
  },
  {
    text: "The key to success is to focus on goals, not obstacles.",
    author: "Anonymous"
  },
  {
    text: "Dream it. Believe it. Build it.",
    author: "Anonymous"
  },
  {
    text: "The blockchain is the most disruptive technology since the internet.",
    author: "Marc Benioff"
  },
  {
    text: "Smart contracts will be the foundation of the new digital economy.",
    author: "Vitalik Buterin"
  },
  {
    text: "Decentralization is not just a technology, it's a philosophy.",
    author: "Anonymous"
  },
  {
    text: "In code we trust, in blockchain we verify.",
    author: "Anonymous"
  },
  {
    text: "The future is built one block at a time.",
    author: "Anonymous"
  }
];

const DeploymentModal: React.FC<DeploymentModalProps> = ({ isOpen, deploymentStatus }) => {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isQuoteVisible, setIsQuoteVisible] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      // Start fade out animation
      setIsQuoteVisible(false);
      
      // After fade out completes, change quote and fade in
      setTimeout(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % inspirationalQuotes.length);
        setIsQuoteVisible(true);
      }, 500); // Half second for fade out
    }, 8000); // Change quote every 8 seconds

    return () => clearInterval(interval);
  }, [isOpen]);

  // Reset quote when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentQuoteIndex(0);
      setIsQuoteVisible(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentQuote = inspirationalQuotes[currentQuoteIndex];

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.deploymentHeader}>
          <div className={styles.deploymentIcon}>
            <div className={styles.spinner}></div>
          </div>
          <h2>Deploying Your Contract</h2>
          <p className={styles.statusText}>{deploymentStatus}</p>
        </div>

        <div className={styles.quoteContainer}>
          <div className={`${styles.quoteCard} ${isQuoteVisible ? styles.visible : styles.hidden}`}>
            <div className={styles.quoteText}>
              "{currentQuote.text}"
            </div>
            <div className={styles.quoteAuthor}>
              — {currentQuote.author}
            </div>
          </div>
        </div>

        <div className={styles.progressIndicator}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill}></div>
          </div>
          <p className={styles.progressText}>Building the future, one block at a time...</p>
        </div>
      </div>
    </div>
  );
};

export default DeploymentModal; 