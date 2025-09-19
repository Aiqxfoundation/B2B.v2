import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Download, Bitcoin, Users, Cpu, TrendingUp, Zap, Globe, Target, Coins, Activity, Clock, Hash, Wallet, Shield, Network, Rocket, Calendar, ChevronRight, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function Whitepaper() {
  const downloadWhitepaper = () => {
    // Create the whitepaper content as HTML - exact match of displayed version
    const content = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>BIT2BLOCK Mining - Whitepaper</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 900px; margin: 40px auto; padding: 30px; line-height: 1.8; background: #0a0a0a; color: #e0e0e0; }
        h1 { color: #f7931a; font-size: 30px; text-align: center; }
        h2 { color: #f7931a; margin-top: 35px; font-size: 24px; }
        h3 { color: #fbbf24; font-size: 18px; margin-top: 20px; }
        h4 { color: #fbbf24; font-size: 16px; }
        .header { text-align: center; padding: 40px 0; background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%); border-radius: 10px; margin-bottom: 40px; }
        .vision { font-size: 36px; font-weight: bold; color: #f7931a; text-align: center; margin: 40px 0 20px; }
        .subtitle { text-align: center; color: #fbbf24; font-size: 18px; margin-bottom: 20px; }
        .feature-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
        .feature { background: #1a1a1a; padding: 20px; border-radius: 8px; border: 1px solid #333; }
        .metric { background: #1a1a1a; padding: 15px; margin: 10px 0; border-radius: 8px; }
        ul { margin: 15px 0; padding-left: 25px; }
        li { margin: 8px 0; }
        .section { margin: 35px 0; }
        .highlight { color: #f7931a; font-weight: bold; }
        .footer { text-align: center; margin-top: 60px; padding-top: 30px; border-top: 1px solid #333; color: #888; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { color: #f7931a; padding: 8px; text-align: left; border-bottom: 1px solid #333; }
        td { padding: 12px 8px; border-bottom: 1px solid rgba(51,51,51,0.5); }
        .progress-bar { background: #1a1a1a; height: 12px; border-radius: 9999px; margin: 5px 0; }
        .progress-fill { background: linear-gradient(to right, #f7931a, #fbbf24); height: 12px; border-radius: 9999px; }
        .formula { background: #1a1a1a; padding: 15px; font-family: 'Courier New', monospace; border: 1px solid #f7931a; border-radius: 5px; color: #fbbf24; text-align: center; font-size: 16px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <!-- Bitcoin Logo -->
        <div style="width: 96px; height: 96px; margin: 0 auto 16px; position: relative;">
            <div style="width: 100%; height: 100%; background: linear-gradient(135deg, #f7931a, #fbbf24); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                <svg viewBox="0 0 32 32" style="width: 56px; height: 56px;" fill="black">
                    <path d="M23.189 13.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.92-.22-1.385-.326l.695-2.783L15.596 5l-.708 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.183-.045-1.13 4.532c-.086.212-.303.531-.793.41.018.025-1.256-.313-1.256-.313l-.858 1.978 2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.95 5.538c-.533 2.147-4.148.986-5.32.695l.95-3.805c1.172.293 4.929.872 4.37 3.11zm.535-5.569c-.487 1.953-3.495.96-4.47.717l.86-3.45c.975.243 4.118.696 3.61 2.733z"/>
                </svg>
            </div>
        </div>
        <h1>GREEN BITCOIN</h1>
        <p style="color: #fbbf24; font-size: 18px; margin-top: 10px;">Decentralized Mining Infrastructure</p>
    </div>
    
    <div class="section">
        <div class="vision">OUR VISION</div>
        <div class="subtitle">Democratizing Bitcoin Mining Through Innovation</div>
        <p>BIT2BLOCK Mining represents the next evolution in cryptocurrency mining - a platform that eliminates traditional barriers to entry. We've built a decentralized infrastructure where anyone can participate in mining without expensive hardware, technical expertise, or operational overhead.</p>
        <p>Our mission is simple: make mining accessible to everyone, everywhere. By leveraging distributed hash power and smart distribution algorithms, we're creating a fair and transparent ecosystem where success isn't determined by capital alone, but by strategic participation and network growth.</p>
        <p style="text-align: center; font-size: 20px; font-weight: bold; color: #f7931a; margin-top: 30px;">Build. Mine. Prosper. Together.</p>
    </div>
    
    <div class="section">
        <h2>🪙 Token Supply Parameters</h2>
        <table>
            <thead>
                <tr>
                    <th>Parameter</th>
                    <th style="text-align: right;">Value</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Maximum Supply</td>
                    <td style="text-align: right; font-weight: bold; color: #fbbf24;">21,000,000 B2B</td>
                </tr>
                <tr>
                    <td>Block Time</td>
                    <td style="text-align: right; color: #fbbf24;">10 minutes</td>
                </tr>
                <tr>
                    <td>Blocks per Day</td>
                    <td style="text-align: right; color: #fbbf24;">144</td>
                </tr>
                <tr>
                    <td>Halving Interval</td>
                    <td style="text-align: right; color: #fbbf24;">210,000 blocks (~4 years)</td>
                </tr>
                <tr>
                    <td>Initial Block Reward</td>
                    <td style="text-align: right; font-weight: bold; color: #fbbf24;">50 B2B</td>
                </tr>
            </tbody>
        </table>
    </div>
    
    <div class="section">
        <h2>⚡ Block Rewards & Halving Schedule</h2>
        <table>
            <thead>
                <tr>
                    <th>Event</th>
                    <th style="text-align: center;">Block #</th>
                    <th style="text-align: center;">Time</th>
                    <th style="text-align: right;">Reward</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Launch</td>
                    <td style="text-align: center;">0</td>
                    <td style="text-align: center;">Month 0</td>
                    <td style="text-align: right; font-weight: bold; color: #fbbf24;">50 B2B</td>
                </tr>
                <tr>
                    <td>1st Halving</td>
                    <td style="text-align: center;">210,000</td>
                    <td style="text-align: center;">~4 years</td>
                    <td style="text-align: right; color: #fbbf24;">25 B2B</td>
                </tr>
                <tr>
                    <td>2nd Halving</td>
                    <td style="text-align: center;">420,000</td>
                    <td style="text-align: center;">~8 years</td>
                    <td style="text-align: right; color: #fbbf24;">12.5 B2B</td>
                </tr>
                <tr>
                    <td>3rd Halving</td>
                    <td style="text-align: center;">630,000</td>
                    <td style="text-align: center;">~12 years</td>
                    <td style="text-align: right; color: #888;">6.25 B2B</td>
                </tr>
                <tr>
                    <td>4th Halving</td>
                    <td style="text-align: center;">840,000</td>
                    <td style="text-align: center;">~16 years</td>
                    <td style="text-align: right; color: #888;">3.125 B2B</td>
                </tr>
            </tbody>
        </table>
        <p style="font-size: 12px; color: #888; margin-top: 16px;">Halving continues every 210,000 blocks until max supply is reached</p>
    </div>
    
    <div class="section">
        <h2>📈 Supply Release Curve</h2>
        <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-size: 14px; color: #888;">Year 1</span>
                <span style="font-size: 14px; font-weight: bold; color: #fbbf24;">~7,560,000 B2B</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: 15%;"></div>
            </div>
        </div>
        <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-size: 14px; color: #888;">Year 2</span>
                <span style="font-size: 14px; font-weight: bold; color: #fbbf24;">~10,500,000 B2B</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: 19%;"></div>
            </div>
        </div>
        <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-size: 14px; color: #888;">Year 5</span>
                <span style="font-size: 14px; font-weight: bold; color: #fbbf24;">~18,375,000 B2B</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: 48%;"></div>
            </div>
        </div>
        <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-size: 14px; color: #888;">Year 10+</span>
                <span style="font-size: 14px; font-weight: bold; color: #f7931a;">21,000,000 B2B</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: 100%;"></div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h2>🚀 Launch Timeline (TGE)</h2>
        <div class="metric" style="background: #1a1a1a; padding: 16px; border: 1px solid #f7931a;">
            <p style="font-size: 14px; color: #ccc; margin-bottom: 8px;">Token Generation Event will occur when we reach:</p>
            <p style="font-size: 24px; font-weight: bold; color: #f7931a;">100K - 1M Verified Participants</p>
            <p style="font-size: 12px; color: #888; margin-top: 8px;">Ensuring strong community adoption and network stability</p>
        </div>
        
        <div style="margin-top: 20px;">
            <div style="display: flex; align-items: start; margin-bottom: 12px;">
                <div style="width: 32px; height: 32px; background: rgba(247,147,26,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                    <span style="color: #f7931a; font-weight: bold;">1</span>
                </div>
                <div>
                    <h4 style="margin: 0;">Mining Phase</h4>
                    <p style="font-size: 12px; color: #888; margin: 4px 0;">Users accumulate rewards before TGE</p>
                </div>
            </div>
            
            <div style="display: flex; align-items: start; margin-bottom: 12px;">
                <div style="width: 32px; height: 32px; background: rgba(247,147,26,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                    <span style="color: #f7931a; font-weight: bold;">2</span>
                </div>
                <div>
                    <h4 style="margin: 0;">TGE Milestone</h4>
                    <p style="font-size: 12px; color: #888; margin: 4px 0;">Official B2B release at network milestone</p>
                </div>
            </div>
            
            <div style="display: flex; align-items: start; margin-bottom: 12px;">
                <div style="width: 32px; height: 32px; background: rgba(247,147,26,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                    <span style="color: #f7931a; font-weight: bold;">3</span>
                </div>
                <div>
                    <h4 style="margin: 0;">Withdrawals Enabled</h4>
                    <p style="font-size: 12px; color: #888; margin: 4px 0;">Transfer tokens to wallets or exchanges</p>
                </div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h2>💸 Referral & Commission System</h2>
        <div style="background: linear-gradient(135deg, rgba(247,147,26,0.1), rgba(251,191,36,0.1)); padding: 16px; border-radius: 8px; border: 1px solid #f7931a; margin-bottom: 16px;">
            <h3 style="margin-bottom: 12px;">Automatic Commission on Hash Purchase</h3>
            <ul style="list-style: none; padding: 0;">
                <li style="margin-bottom: 12px;">• <span class="highlight">10% USDT Commission:</span> Automatically receive 10% when your referral purchases hash power</li>
                <li style="margin-bottom: 12px;">• <span class="highlight">Instant Detection:</span> System detects hash purchases and transfers commission immediately</li>
                <li style="margin-bottom: 12px;">• <span class="highlight">Example:</span> Referral buys $50 hash → You get $5 USDT instantly</li>
            </ul>
        </div>
        
        <div class="metric" style="text-align: center; background: linear-gradient(135deg, rgba(247,147,26,0.2), rgba(251,191,36,0.2));">
            <p style="color: #f7931a; font-weight: bold; font-size: 14px;">🚀 Commission Based on Hash Purchase - Not Deposit!</p>
            <p style="color: #fbbf24; font-size: 12px; margin-top: 4px;">Your earnings grow with your network's mining activity</p>
        </div>
    </div>
    
    <div class="section">
        <h2>🔄 P2P Transfer & Trading (Pre-TGE)</h2>
        <div style="background: #1a1a1a; padding: 16px; border-radius: 8px; border: 1px solid #f7931a; margin-bottom: 16px;">
            <h3>Trade B2B Before Official Launch</h3>
            <p style="font-size: 14px;">B2B supports peer-to-peer transfers between users, enabling an organic secondary market before the Token Generation Event. This creates immediate liquidity and price discovery during the mining phase.</p>
        </div>
        
        <div class="feature" style="margin-bottom: 16px;">
            <h4>▶ Instant P2P Transfers</h4>
            <p style="font-size: 14px; color: #888;">Send B2B directly to any user within the platform using their username. Transfers are instant and secure.</p>
        </div>
        
        <div class="feature" style="margin-bottom: 16px;">
            <h4>▶ Self-Managed Trading</h4>
            <p style="font-size: 14px; color: #888;">Create your own ask/bid prices for B2B based on personal deals:</p>
            <ul style="font-size: 12px; color: #888;">
                <li>• Negotiate prices directly with other miners</li>
                <li>• Execute trades through P2P transfers</li>
                <li>• Build reputation as a trusted trader</li>
                <li>• Benefit from early price appreciation</li>
            </ul>
        </div>
        
        <div class="feature" style="margin-bottom: 16px;">
            <h4>▶ Trading Benefits</h4>
            <div class="feature-grid">
                <div style="background: rgba(0,0,0,0.5); padding: 8px; border-radius: 4px;">
                    <p style="color: #fbbf24; font-weight: bold; font-size: 12px;">For Sellers:</p>
                    <p style="color: #888; font-size: 12px;">Realize profits before TGE</p>
                </div>
                <div style="background: rgba(0,0,0,0.5); padding: 8px; border-radius: 4px;">
                    <p style="color: #fbbf24; font-weight: bold; font-size: 12px;">For Buyers:</p>
                    <p style="color: #888; font-size: 12px;">Accumulate at lower prices</p>
                </div>
            </div>
        </div>
        
        <div class="metric" style="text-align: center; background: linear-gradient(135deg, rgba(247,147,26,0.2), rgba(251,191,36,0.2));">
            <p style="color: #f7931a; font-weight: bold; font-size: 14px;">⚡ P2P Market Active Now</p>
            <p style="color: #888; font-size: 12px; margin-top: 4px;">Start trading B2B with other miners - No waiting for TGE!</p>
        </div>
    </div>
    
    <div class="section">
        <h2>🌐 Utility & Multi-Chain Expansion</h2>
        
        <div class="feature" style="margin-bottom: 16px;">
            <h4>▶ Wrapped Bitcoin Style</h4>
            <p style="font-size: 14px; color: #888;">Bridge to Ethereum, Solana, BSC, Polygon for cross-chain liquidity</p>
        </div>
        
        <div class="feature" style="margin-bottom: 16px;">
            <h4>▶ DeFi Integration</h4>
            <p style="font-size: 14px; color: #888;">Stake, farm, and provide liquidity on decentralized exchanges</p>
        </div>
        
        <div class="feature" style="margin-bottom: 16px;">
            <h4>▶ Bridge Utility</h4>
            <p style="font-size: 14px; color: #888;">Seamlessly move B2B between chains for maximum flexibility</p>
        </div>
        
        <div class="feature" style="margin-bottom: 16px;">
            <h4>▶ BTC Relationship</h4>
            <p style="font-size: 14px; color: #888;">Same max supply as Bitcoin (21M vs 21M), optimized for DeFi adoption</p>
        </div>
    </div>
    
    <div class="section">
        <h2>⚡ Core Technology</h2>
        <div class="feature-grid">
            <div class="feature">
                <h4># Smart Mining</h4>
                <ul style="font-size: 14px; color: #888;">
                    <li>• Distributed hash power</li>
                    <li>• Proportional rewards</li>
                    <li>• Real-time adjustments</li>
                    <li>• Automated operations</li>
                </ul>
            </div>
            
            <div class="feature">
                <h4>🕐 Block Cycles</h4>
                <ul style="font-size: 14px; color: #888;">
                    <li>• 144 blocks per day</li>
                    <li>• Reset at 00:00 UTC</li>
                    <li>• Continuous height</li>
                    <li>• Predictable schedule</li>
                </ul>
            </div>
            
            <div class="feature">
                <h4>🛡️ Security</h4>
                <ul style="font-size: 14px; color: #888;">
                    <li>• Username identity</li>
                    <li>• 6-digit PIN</li>
                    <li>• Zero-knowledge</li>
                    <li>• Full anonymity</li>
                </ul>
            </div>
            
            <div class="feature">
                <h4>👥 Referral Network</h4>
                <ul style="font-size: 14px; color: #888;">
                    <li>• 10% USDT commission</li>
                    <li>• Instant rewards</li>
                    <li>• Single-tier system</li>
                    <li>• Build your network</li>
                </ul>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h2>🚀 Platform Features</h2>
        
        <h3>Hash Power Acquisition</h3>
        <p>Purchase computational power directly with USDT to begin mining immediately. Your hash power determines your share of block rewards.</p>
        
        <div class="formula">
            Mining Rewards = (Your Hash Power ÷ Network Hash Power) × Block Reward
        </div>
        
        <h3>Active Mining Protocol</h3>
        <p>Our 24-hour claim system ensures network vitality by requiring miners to actively participate. This prevents resource hoarding and maintains fair distribution among engaged participants.</p>
    </div>
    
    <div class="section">
        <h2>🎯 Strategic Advantages</h2>
        <div class="feature-grid">
            <div class="feature">
                <h4>Zero Hardware Investment</h4>
                <p style="font-size: 14px;">No need for expensive mining rigs, cooling systems, or technical maintenance. Access professional mining capabilities through our infrastructure.</p>
            </div>
            
            <div class="feature">
                <h4>Predictable Returns</h4>
                <p style="font-size: 14px;">Transparent reward calculations based on your hash power percentage. Monitor your earnings in real-time with our comprehensive dashboard.</p>
            </div>
            
            <div class="feature">
                <h4>Global Accessibility</h4>
                <p style="font-size: 14px;">Mine from anywhere in the world with just an internet connection. Our platform operates 24/7 across all time zones.</p>
            </div>
            
            <div class="feature">
                <h4>Community Growth</h4>
                <p style="font-size: 14px;">Build your mining network and earn from both personal mining and referral commissions. Grow together with the ecosystem.</p>
            </div>
        </div>
    </div>
    
    <div class="footer">
        <p style="font-size: 20px; color: #f7931a; margin-bottom: 10px;">
            <strong>BIT2BLOCK Mining - Where Mining Meets Innovation</strong>
        </p>
        <p>© 2025 BIT2BLOCK Mining. Building the Future of Decentralized Mining.</p>
    </div>
</body>
</html>`;
    
    // Create a Blob from the content
    const blob = new Blob([content], { type: 'text/html' });
    
    // Create a download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'B2B_Whitepaper.html';
    
    // Trigger the download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-lg border-b border-[#f7931a]/20 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/mining">
            <Button variant="ghost" size="sm" className="text-[#f7931a] hover:text-[#fbbf24]">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-[#f7931a]">
            WHITEPAPER
          </h1>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#f7931a] hover:text-[#fbbf24]"
            onClick={downloadWhitepaper}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-[#1a1a1a] to-black border-[#f7931a]/30">
            <div className="p-6 text-center">
              {/* Professional Bitcoin Logo */}
              <div className="relative w-24 h-24 mx-auto mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-[#f7931a] to-[#fbbf24] rounded-full opacity-20 blur-xl animate-pulse"></div>
                <div className="relative w-full h-full bg-gradient-to-br from-[#f7931a] to-[#fbbf24] rounded-full flex items-center justify-center shadow-2xl">
                  <div className="text-5xl font-bold text-black">
                    <svg viewBox="0 0 32 32" className="w-14 h-14" fill="currentColor">
                      <path d="M23.189 13.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.92-.22-1.385-.326l.695-2.783L15.596 5l-.708 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.183-.045-1.13 4.532c-.086.212-.303.531-.793.41.018.025-1.256-.313-1.256-.313l-.858 1.978 2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.95 5.538c-.533 2.147-4.148.986-5.32.695l.95-3.805c1.172.293 4.929.872 4.37 3.11zm.535-5.569c-.487 1.953-3.495.96-4.47.717l.86-3.45c.975.243 4.118.696 3.61 2.733z"/>
                    </svg>
                  </div>
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-20 h-4 bg-[#f7931a]/20 rounded-full blur-md"></div>
              </div>
              <h1 className="text-3xl font-bold text-[#f7931a] mb-2">
                GREEN BITCOIN
              </h1>
              <p className="text-lg text-[#fbbf24]">
                Decentralized Mining Infrastructure
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Vision Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-black border-[#f7931a]/20">
            <div className="p-6">
              <h2 className="text-4xl font-bold text-center text-[#f7931a] mb-6">
                OUR VISION
              </h2>
              <p className="text-[#fbbf24] text-center text-lg mb-6">
                Democratizing Bitcoin Mining Through Innovation
              </p>
              <div className="space-y-4 text-gray-300">
                <p>
                  BIT2BLOCK Mining represents the next evolution in cryptocurrency mining - a platform that eliminates traditional barriers to entry. We've built a decentralized infrastructure where anyone can participate in mining without expensive hardware, technical expertise, or operational overhead.
                </p>
                <p>
                  Our mission is simple: make mining accessible to everyone, everywhere. By leveraging distributed hash power and smart distribution algorithms, we're creating a fair and transparent ecosystem where success isn't determined by capital alone, but by strategic participation and network growth.
                </p>
                <p className="text-center text-xl font-bold text-[#f7931a] mt-6">
                  Build. Mine. Prosper. Together.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Token Supply Parameters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-black border-[#f7931a]/20">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Coins className="w-6 h-6 text-[#f7931a] mr-2" />
                <h2 className="text-2xl font-bold text-[#f7931a]">Token Supply Parameters</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#333]">
                      <th className="text-left py-2 text-[#f7931a]">Parameter</th>
                      <th className="text-right py-2 text-[#f7931a]">Value</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    <tr className="border-b border-[#333]/50">
                      <td className="py-3">Maximum Supply</td>
                      <td className="text-right font-bold text-[#fbbf24]">21,000,000 B2B</td>
                    </tr>
                    <tr className="border-b border-[#333]/50">
                      <td className="py-3">Block Time</td>
                      <td className="text-right text-[#fbbf24]">10 minutes</td>
                    </tr>
                    <tr className="border-b border-[#333]/50">
                      <td className="py-3">Blocks per Day</td>
                      <td className="text-right text-[#fbbf24]">144</td>
                    </tr>
                    <tr className="border-b border-[#333]/50">
                      <td className="py-3">Halving Interval</td>
                      <td className="text-right text-[#fbbf24]">210,000 blocks (~4 years)</td>
                    </tr>
                    <tr>
                      <td className="py-3">Initial Block Reward</td>
                      <td className="text-right font-bold text-[#fbbf24]">50 B2B</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Block Rewards & Halving Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-black border-[#f7931a]/20">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Zap className="w-6 h-6 text-[#f7931a] mr-2" />
                <h2 className="text-2xl font-bold text-[#f7931a]">Block Rewards & Halving Schedule</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#333]">
                      <th className="text-left py-2 text-[#f7931a]">Event</th>
                      <th className="text-center py-2 text-[#f7931a]">Block #</th>
                      <th className="text-center py-2 text-[#f7931a]">Time</th>
                      <th className="text-right py-2 text-[#f7931a]">Reward</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    <tr className="border-b border-[#333]/50">
                      <td className="py-2">Launch</td>
                      <td className="text-center">0</td>
                      <td className="text-center">Month 0</td>
                      <td className="text-right font-bold text-[#fbbf24]">50 B2B</td>
                    </tr>
                    <tr className="border-b border-[#333]/50">
                      <td className="py-2">1st Halving</td>
                      <td className="text-center">210,000</td>
                      <td className="text-center">~6 months</td>
                      <td className="text-right text-[#fbbf24]">25 B2B</td>
                    </tr>
                    <tr className="border-b border-[#333]/50">
                      <td className="py-2">2nd Halving</td>
                      <td className="text-center">8,400</td>
                      <td className="text-center">~12 months</td>
                      <td className="text-right text-[#fbbf24]">12.5 B2B</td>
                    </tr>
                    <tr className="border-b border-[#333]/50">
                      <td className="py-2">3rd Halving</td>
                      <td className="text-center">12,600</td>
                      <td className="text-center">~18 months</td>
                      <td className="text-right text-gray-400">6.25 B2B</td>
                    </tr>
                    <tr>
                      <td className="py-2">4th Halving</td>
                      <td className="text-center">16,800</td>
                      <td className="text-center">~24 months</td>
                      <td className="text-right text-gray-400">3.125 B2B</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <p className="text-xs text-gray-400 mt-4">
                Halving continues every 210,000 blocks until max supply is reached
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Supply Release Curve */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-black border-[#f7931a]/20">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <TrendingUp className="w-6 h-6 text-[#f7931a] mr-2" />
                <h2 className="text-2xl font-bold text-[#f7931a]">Supply Release Curve</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-400">Year 1</span>
                    <span className="text-sm font-bold text-[#fbbf24]">~315,000 B2B</span>
                  </div>
                  <div className="w-full bg-[#1a1a1a] rounded-full h-3">
                    <div className="bg-gradient-to-r from-[#f7931a] to-[#fbbf24] h-3 rounded-full" style={{width: '15%'}}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-400">Year 2</span>
                    <span className="text-sm font-bold text-[#fbbf24]">~393,750 B2B</span>
                  </div>
                  <div className="w-full bg-[#1a1a1a] rounded-full h-3">
                    <div className="bg-gradient-to-r from-[#f7931a] to-[#fbbf24] h-3 rounded-full" style={{width: '19%'}}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-400">Year 5</span>
                    <span className="text-sm font-bold text-[#fbbf24]">~1,000,000 B2B</span>
                  </div>
                  <div className="w-full bg-[#1a1a1a] rounded-full h-3">
                    <div className="bg-gradient-to-r from-[#f7931a] to-[#fbbf24] h-3 rounded-full" style={{width: '48%'}}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-400">Year 10+</span>
                    <span className="text-sm font-bold text-[#f7931a]">21,000,000 B2B</span>
                  </div>
                  <div className="w-full bg-[#1a1a1a] rounded-full h-3">
                    <div className="bg-gradient-to-r from-[#f7931a] to-[#fbbf24] h-3 rounded-full" style={{width: '100%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Launch Timeline (TGE) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="bg-black border-[#f7931a]/20">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Rocket className="w-6 h-6 text-[#f7931a] mr-2" />
                <h2 className="text-2xl font-bold text-[#f7931a]">Launch Timeline (TGE)</h2>
              </div>
              
              <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#f7931a]/30 mb-4">
                <p className="text-sm text-gray-300 mb-2">
                  Token Generation Event will occur when we reach:
                </p>
                <p className="text-2xl font-bold text-[#f7931a]">
                  100K - 1M Verified Participants
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Ensuring strong community adoption and network stability
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-[#f7931a]/20 flex items-center justify-center mr-3 mt-1">
                    <span className="text-[#f7931a] font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="text-[#fbbf24] font-semibold mb-1">Mining Phase</h4>
                    <p className="text-xs text-gray-400">Users accumulate rewards before TGE</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-[#f7931a]/20 flex items-center justify-center mr-3 mt-1">
                    <span className="text-[#f7931a] font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="text-[#fbbf24] font-semibold mb-1">TGE Milestone</h4>
                    <p className="text-xs text-gray-400">Official B2B release at network milestone</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-[#f7931a]/20 flex items-center justify-center mr-3 mt-1">
                    <span className="text-[#f7931a] font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="text-[#fbbf24] font-semibold mb-1">Withdrawals Enabled</h4>
                    <p className="text-xs text-gray-400">Transfer tokens to wallets or exchanges</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Referral & Commission System */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="bg-black border-[#f7931a]/20">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Users className="w-6 h-6 text-[#f7931a] mr-2" />
                <h2 className="text-2xl font-bold text-[#f7931a]">Referral & Commission System</h2>
              </div>
              
              <div className="bg-gradient-to-br from-[#f7931a]/10 to-[#fbbf24]/10 p-4 rounded-lg border border-[#f7931a]/30 mb-4">
                <h3 className="text-lg font-bold text-[#fbbf24] mb-3">Automatic Commission on Hash Purchase</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <span className="text-[#f7931a] mr-2">•</span>
                    <div>
                      <p className="text-sm text-gray-300"><span className="font-bold text-[#fbbf24]">10% USDT Commission:</span> Automatically receive 10% when your referral purchases hash power</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="text-[#f7931a] mr-2">•</span>
                    <div>
                      <p className="text-sm text-gray-300"><span className="font-bold text-[#fbbf24]">Instant Detection:</span> System detects hash purchases and transfers commission immediately</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="text-[#f7931a] mr-2">•</span>
                    <div>
                      <p className="text-sm text-gray-300"><span className="font-bold text-[#fbbf24]">Example:</span> Referral buys $50 hash → You get $5 USDT instantly</p>
                    </div>
                  </div>
                </div>
              </div>
              
              
              <div className="p-3 bg-gradient-to-r from-[#f7931a]/20 to-[#fbbf24]/20 rounded-lg">
                <p className="text-center text-sm font-bold text-[#f7931a]">
                  🚀 Commission Based on Hash Purchase - Not Deposit!
                </p>
                <p className="text-center text-xs text-[#fbbf24] mt-1">
                  Your earnings grow with your network's mining activity
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* P2P Transfer & Trading System */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Card className="bg-black border-[#f7931a]/20">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Activity className="w-6 h-6 text-[#f7931a] mr-2" />
                <h2 className="text-2xl font-bold text-[#f7931a]">P2P Transfer & Trading (Pre-TGE)</h2>
              </div>
              
              <div className="bg-gradient-to-br from-[#1a1a1a] to-black p-4 rounded-lg border border-[#f7931a]/30 mb-4">
                <h3 className="text-lg font-bold text-[#fbbf24] mb-2">Trade B2B Before Official Launch</h3>
                <p className="text-sm text-gray-300 mb-3">
                  B2B supports peer-to-peer transfers between users, enabling an organic secondary market before the Token Generation Event. This creates immediate liquidity and price discovery during the mining phase.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333]">
                  <div className="flex items-center mb-2">
                    <ChevronRight className="w-5 h-5 text-[#fbbf24] mr-2" />
                    <h3 className="font-semibold text-[#fbbf24]">Instant P2P Transfers</h3>
                  </div>
                  <p className="text-sm text-gray-400">
                    Send B2B directly to any user within the platform using their username. Transfers are instant and secure.
                  </p>
                </div>
                
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333]">
                  <div className="flex items-center mb-2">
                    <ChevronRight className="w-5 h-5 text-[#fbbf24] mr-2" />
                    <h3 className="font-semibold text-[#fbbf24]">Self-Managed Trading</h3>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">
                    Create your own ask/bid prices for B2B based on personal deals:
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1 ml-4">
                    <li>• Negotiate prices directly with other miners</li>
                    <li>• Execute trades through P2P transfers</li>
                    <li>• Build reputation as a trusted trader</li>
                    <li>• Benefit from early price appreciation</li>
                  </ul>
                </div>
                
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333]">
                  <div className="flex items-center mb-2">
                    <ChevronRight className="w-5 h-5 text-[#fbbf24] mr-2" />
                    <h3 className="font-semibold text-[#fbbf24]">Trading Benefits</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-black/50 p-2 rounded">
                      <p className="text-[#fbbf24] font-semibold">For Sellers:</p>
                      <p className="text-gray-400">Realize profits before TGE</p>
                    </div>
                    <div className="bg-black/50 p-2 rounded">
                      <p className="text-[#fbbf24] font-semibold">For Buyers:</p>
                      <p className="text-gray-400">Accumulate at lower prices</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gradient-to-r from-[#f7931a]/20 to-[#fbbf24]/20 rounded-lg">
                <p className="text-center text-sm font-bold text-[#f7931a]">
                  ⚡ P2P Market Active Now
                </p>
                <p className="text-center text-xs text-gray-400 mt-1">
                  Start trading B2B with other miners - No waiting for TGE!
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Utility & Multi-Chain Expansion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Card className="bg-black border-[#f7931a]/20">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Network className="w-6 h-6 text-[#f7931a] mr-2" />
                <h2 className="text-2xl font-bold text-[#f7931a]">Utility & Multi-Chain Expansion</h2>
              </div>
              
              <div className="space-y-4">
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333]">
                  <div className="flex items-center mb-2">
                    <ChevronRight className="w-5 h-5 text-[#fbbf24] mr-2" />
                    <h3 className="font-semibold text-[#fbbf24]">Wrapped Bitcoin Style</h3>
                  </div>
                  <p className="text-sm text-gray-400">
                    Bridge to Ethereum, Solana, BSC, Polygon for cross-chain liquidity
                  </p>
                </div>
                
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333]">
                  <div className="flex items-center mb-2">
                    <ChevronRight className="w-5 h-5 text-[#fbbf24] mr-2" />
                    <h3 className="font-semibold text-[#fbbf24]">DeFi Integration</h3>
                  </div>
                  <p className="text-sm text-gray-400">
                    Stake, farm, and provide liquidity on decentralized exchanges
                  </p>
                </div>
                
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333]">
                  <div className="flex items-center mb-2">
                    <ChevronRight className="w-5 h-5 text-[#fbbf24] mr-2" />
                    <h3 className="font-semibold text-[#fbbf24]">Bridge Utility</h3>
                  </div>
                  <p className="text-sm text-gray-400">
                    Seamlessly move B2B between chains for maximum flexibility
                  </p>
                </div>
                
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333]">
                  <div className="flex items-center mb-2">
                    <ChevronRight className="w-5 h-5 text-[#fbbf24] mr-2" />
                    <h3 className="font-semibold text-[#fbbf24]">BTC Relationship</h3>
                  </div>
                  <p className="text-sm text-gray-400">
                    10x rarer than Bitcoin (2.1M vs 21M), optimized for DeFi adoption
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Core Technology */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <Card className="bg-black border-[#f7931a]/20">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Cpu className="w-6 h-6 text-[#f7931a] mr-2" />
                <h2 className="text-2xl font-bold text-[#f7931a]">Core Technology</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333]">
                  <div className="flex items-center mb-2">
                    <Hash className="w-5 h-5 text-[#fbbf24] mr-2" />
                    <h3 className="font-semibold text-[#fbbf24]">Smart Mining</h3>
                  </div>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Distributed hash power</li>
                    <li>• Proportional rewards</li>
                    <li>• Real-time adjustments</li>
                    <li>• Automated operations</li>
                  </ul>
                </div>
                
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333]">
                  <div className="flex items-center mb-2">
                    <Clock className="w-5 h-5 text-[#fbbf24] mr-2" />
                    <h3 className="font-semibold text-[#fbbf24]">Block Cycles</h3>
                  </div>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• 144 blocks per day</li>
                    <li>• Reset at 00:00 UTC</li>
                    <li>• Continuous height</li>
                    <li>• Predictable schedule</li>
                  </ul>
                </div>
                
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333]">
                  <div className="flex items-center mb-2">
                    <Shield className="w-5 h-5 text-[#fbbf24] mr-2" />
                    <h3 className="font-semibold text-[#fbbf24]">Security</h3>
                  </div>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Username identity</li>
                    <li>• 6-digit PIN</li>
                    <li>• Zero-knowledge</li>
                    <li>• Full anonymity</li>
                  </ul>
                </div>
                
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333]">
                  <div className="flex items-center mb-2">
                    <Users className="w-5 h-5 text-[#fbbf24] mr-2" />
                    <h3 className="font-semibold text-[#fbbf24]">Referral Network</h3>
                  </div>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• 10% USDT commission</li>
                    <li>• Instant rewards</li>
                    <li>• Single-tier system</li>
                    <li>• Build your network</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Platform Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          <Card className="bg-black border-[#f7931a]/20">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Target className="w-6 h-6 text-[#f7931a] mr-2" />
                <h2 className="text-2xl font-bold text-[#f7931a]">Platform Features</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#fbbf24] mb-2">Hash Power Acquisition</h3>
                  <p className="text-sm text-gray-300 mb-3">
                    Purchase computational power directly with USDT to begin mining immediately. Your hash power determines your share of block rewards.
                  </p>
                  
                  <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#f7931a]/30">
                    <p className="text-center text-[#fbbf24] font-mono">
                      Mining Rewards = (Your Hash Power ÷ Network Hash Power) × Block Reward
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-[#fbbf24] mb-2">Active Mining Protocol</h3>
                  <p className="text-sm text-gray-300">
                    Our 24-hour claim system ensures network vitality by requiring miners to actively participate. This prevents resource hoarding and maintains fair distribution among engaged participants.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Strategic Advantages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
        >
          <Card className="bg-black border-[#f7931a]/20">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Globe className="w-6 h-6 text-[#f7931a] mr-2" />
                <h2 className="text-2xl font-bold text-[#f7931a]">Strategic Advantages</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333]">
                  <h4 className="text-[#fbbf24] font-semibold mb-2">Zero Hardware Investment</h4>
                  <p className="text-sm text-gray-400">
                    No need for expensive mining rigs, cooling systems, or technical maintenance. Access professional mining capabilities through our infrastructure.
                  </p>
                </div>
                
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333]">
                  <h4 className="text-[#fbbf24] font-semibold mb-2">Predictable Returns</h4>
                  <p className="text-sm text-gray-400">
                    Transparent reward calculations based on your hash power percentage. Monitor your earnings in real-time with our comprehensive dashboard.
                  </p>
                </div>
                
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333]">
                  <h4 className="text-[#fbbf24] font-semibold mb-2">Global Accessibility</h4>
                  <p className="text-sm text-gray-400">
                    Mine from anywhere in the world with just an internet connection. Our platform operates 24/7 across all time zones.
                  </p>
                </div>
                
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333]">
                  <h4 className="text-[#fbbf24] font-semibold mb-2">Community Growth</h4>
                  <p className="text-sm text-gray-400">
                    Build your mining network and earn from both personal mining and referral commissions. Grow together with the ecosystem.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.2 }}
        >
          <div className="text-center pt-8 pb-4 border-t border-[#333]">
            <p className="text-[#f7931a] text-lg font-bold mb-2">
              BIT2BLOCK Mining - Where Mining Meets Innovation
            </p>
            <p className="text-gray-500 text-sm">
              © 2025 BIT2BLOCK Mining. Building the Future of Decentralized Mining.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}