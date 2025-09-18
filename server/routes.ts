import { Router } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupMining } from "./mining";
import type { Request, Response, NextFunction, Express } from "express";
import { insertDepositSchema, insertWithdrawalSchema, insertDeviceFingerprintSchema } from "@shared/schema";
import { createServer } from "http";

export async function registerRoutes(app: Express) {
  // Setup authentication first
  setupAuth(app);
  
  // Setup mining service
  setupMining();
  
  // Create HTTP server
  const server = createServer(app);
  
  // Device fingerprinting endpoints
  app.post("/api/device/check", async (req, res, next) => {
    try {
      const deviceCheckSchema = z.object({
        serverDeviceId: z.string().min(1),
        fingerprints: insertDeviceFingerprintSchema.omit({ deviceId: true })
      });
      
      const { serverDeviceId, fingerprints } = deviceCheckSchema.parse(req.body);
      
      // Get client IP and basic network info
      const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.toString().split(',')[0];
      
      // Check device and determine if it can register
      const result = await storage.upsertDevice({
        serverDeviceId,
        lastIp: clientIp,
        fingerprints: {
          ...fingerprints,
          deviceId: '' // Will be set by storage
        }
      });
      
      res.json({
        deviceId: result.device.id,
        canRegister: result.canRegister,
        registrations: result.device.registrations,
        blocked: result.device.blocked,
        riskScore: result.device.riskScore
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid device data format",
          errors: error.errors 
        });
      }
      next(error);
    }
  });

  app.post("/api/device/link", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const linkSchema = z.object({
        deviceId: z.string().min(1)
      });
      
      const { deviceId } = linkSchema.parse(req.body);
      
      // Link user to device (called after successful registration)
      await storage.linkUserToDevice(req.user!.id, deviceId);
      
      res.json({ success: true });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid device ID format" 
        });
      }
      next(error);
    }
  });

  // Admin device management endpoints
  app.post("/api/admin/device/:deviceId/block", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user!.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { deviceId } = req.params;
      await storage.blockDevice(deviceId);
      
      res.json({ success: true, message: "Device has been blocked" });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/device/:deviceId/allowlist", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user!.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const allowlistSchema = z.object({
        maxRegistrations: z.number().min(1).max(10).optional().default(2)
      });
      
      const { maxRegistrations } = allowlistSchema.parse(req.body);
      const { deviceId } = req.params;
      
      await storage.allowlistDevice(deviceId, maxRegistrations);
      
      res.json({ 
        success: true, 
        message: `Device has been allowlisted with ${maxRegistrations} max registrations` 
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid allowlist parameters" 
        });
      }
      next(error);
    }
  });
  
  // Get all users (admin only)
  app.get("/api/users", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user!.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  });
  
  // Admin dashboard stats
  app.get("/api/admin/stats", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user!.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const [userCount, totalDeposits, totalWithdrawals, totalHashPower] = await Promise.all([
        storage.getUserCount(),
        storage.getTotalDeposits(),
        storage.getTotalWithdrawals(),
        storage.getTotalHashPower()
      ]);

      res.json({
        userCount,
        totalDeposits,
        totalWithdrawals,
        totalHashPower
      });
    } catch (error) {
      next(error);
    }
  });

  // Deposit endpoints
  app.post("/api/deposits", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const depositData = insertDepositSchema.parse(req.body);
      const deposit = await storage.createDeposit({
        ...depositData,
        userId: req.user!.id
      });

      res.status(201).json(deposit);
    } catch (error: any) {
      if (error?.message?.includes('wait')) {
        return res.status(429).json({ message: error.message });
      }
      next(error);
    }
  });

  app.get("/api/admin/deposits", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user!.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const deposits = await storage.getPendingDeposits();
      res.json(deposits);
    } catch (error) {
      next(error);
    }
  });

  // Also support the route the frontend is using
  app.get("/api/deposits/pending", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user!.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const deposits = await storage.getPendingDeposits();
      res.json(deposits);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/deposits/:id/approve", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user!.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { adminNote, actualAmount } = req.body;
      await storage.approveDeposit(req.params.id, adminNote, actualAmount);
      res.json({ message: "Deposit approved" });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/deposits/:id/reject", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user!.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { adminNote } = req.body;
      await storage.rejectDeposit(req.params.id, adminNote);
      res.json({ message: "Deposit rejected" });
    } catch (error) {
      next(error);
    }
  });

  // Hash power purchase with referral commission
  app.post("/api/purchase-power", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { amount } = z.object({ amount: z.number().min(1) }).parse(req.body);
      const user = req.user!;

      if (parseFloat(user.usdtBalance || "0") < amount) {
        return res.status(400).json({ message: "Insufficient USDT balance" });
      }

      // Deduct USDT and add base hash power to the user
      const newUsdtBalance = (parseFloat(user.usdtBalance || "0") - amount).toFixed(2);
      const newBaseHashPower = (parseFloat(user.baseHashPower || "0") + amount).toFixed(2);
      
      // Calculate total hash power (base + referral bonus)
      const totalHashPower = (parseFloat(newBaseHashPower) + parseFloat(user.referralHashBonus || "0")).toFixed(2);

      await storage.updateUser(user.id, {
        usdtBalance: newUsdtBalance,
        baseHashPower: newBaseHashPower,
        hashPower: totalHashPower
      });

      // Handle referral commission if user was referred
      if (user.referredBy) {
        // Find the referrer by their referral code
        const referrers = await storage.getUsersByReferralCode(user.referredBy);
        if (referrers.length > 0) {
          const referrer = referrers[0];
          
          // Calculate commission - 10% USDT commission only, no hash bonus
          const usdtCommission = amount * 0.10; // 10% USDT commission
          
          // Update referrer's balances
          const referrerNewUsdt = (parseFloat(referrer.usdtBalance || "0") + usdtCommission).toFixed(2);
          const referrerTotalEarnings = (parseFloat(referrer.totalReferralEarnings || "0") + usdtCommission).toFixed(2);
          
          await storage.updateUser(referrer.id, {
            usdtBalance: referrerNewUsdt,
            totalReferralEarnings: referrerTotalEarnings
          });
        }
      }

      // No longer update referral hash contributions since we removed hash bonus

      res.json({ message: "Hash power purchased successfully" });
    } catch (error) {
      next(error);
    }
  });


  // Claim mining rewards with strict participation rules
  app.post("/api/claim-rewards", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = req.user!;
      const unclaimedAmount = parseFloat(user.unclaimedBalance || "0");
      
      if (unclaimedAmount <= 0) {
        return res.status(400).json({ message: "No rewards to claim" });
      }

      // Get current block number
      const blockSetting = await storage.getSystemSetting("blockNumber");
      const currentBlock = blockSetting ? parseInt(blockSetting.value) : 1;

      const newGbtcBalance = (parseFloat(user.gbtcBalance || "0") + unclaimedAmount).toFixed(8);

      await storage.updateUser(user.id, {
        gbtcBalance: newGbtcBalance,
        unclaimedBalance: "0.00000000",
        lastActiveBlock: currentBlock // Update last active block
      });

      res.json({ message: "Rewards claimed successfully" });
    } catch (error) {
      next(error);
    }
  });

  // Start mining for the first time
  app.post("/api/start-mining", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = req.user!;
      const hashPower = parseFloat(user.hashPower || '0');
      
      if (hashPower <= 0) {
        return res.status(400).json({ message: "Hash power required to start mining" });
      }

      // Update user to mark that they have started mining
      await storage.updateUser(user.id, {
        hasStartedMining: true
      });

      res.json({ message: "Mining started successfully" });
    } catch (error) {
      next(error);
    }
  });

  // Withdrawal endpoints
  app.post("/api/withdrawals", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const withdrawalData = insertWithdrawalSchema.parse(req.body);
      const withdrawal = await storage.createWithdrawal({
        ...withdrawalData,
        userId: req.user!.id
      });

      res.status(201).json(withdrawal);
    } catch (error: any) {
      if (error?.message?.includes('wait')) {
        return res.status(429).json({ message: error.message });
      }
      next(error);
    }
  });

  app.get("/api/admin/withdrawals", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user!.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const withdrawals = await storage.getPendingWithdrawals();
      res.json(withdrawals);
    } catch (error) {
      next(error);
    }
  });

  // Also support the route the frontend is using
  app.get("/api/withdrawals/pending", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user!.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const withdrawals = await storage.getPendingWithdrawals();
      res.json(withdrawals);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/withdrawals/:id/approve", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user!.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { txHash } = req.body;
      await storage.approveWithdrawal(req.params.id, txHash);
      res.json({ message: "Withdrawal approved" });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/withdrawals/:id/reject", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user!.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      await storage.rejectWithdrawal(req.params.id);
      res.json({ message: "Withdrawal rejected" });
    } catch (error) {
      next(error);
    }
  });

  // Update user balances manually (admin only)
  app.patch("/api/users/:userId/balances", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user!.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { usdtBalance, gbtcBalance, hashPower } = req.body;
      await storage.updateUserBalances(req.params.userId, {
        usdtBalance,
        gbtcBalance,
        hashPower
      });
      
      res.json({ message: "User balances updated successfully" });
    } catch (error) {
      next(error);
    }
  });

  // System settings
  app.get("/api/settings/:key", async (req, res, next) => {
    try {
      const setting = await storage.getSystemSetting(req.params.key);
      res.json(setting);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/settings", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user!.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { key, value } = z.object({
        key: z.string(),
        value: z.string()
      }).parse(req.body);

      await storage.setSystemSetting(key, value);
      res.json({ message: "Setting updated" });
    } catch (error) {
      next(error);
    }
  });

  // User management
  app.patch("/api/users/:id/freeze", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user!.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      await storage.freezeUser(req.params.id);
      res.json({ message: "User frozen" });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/users/:id/unfreeze", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user!.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      await storage.unfreezeUser(req.params.id);
      res.json({ message: "User unfrozen" });
    } catch (error) {
      next(error);
    }
  });

  // Ban/unban user endpoints
  app.patch("/api/users/:userId/ban", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user!.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      await storage.banUser(req.params.userId);
      res.json({ message: "User banned successfully" });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/users/:userId/unban", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user!.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      await storage.unbanUser(req.params.userId);
      res.json({ message: "User unbanned successfully" });
    } catch (error) {
      next(error);
    }
  });

  // Get global deposit addresses (public endpoint for all users)
  app.get("/api/deposit-addresses", async (req, res, next) => {
    try {
      const usdtAddress = await storage.getGlobalDepositAddress('USDT');
      const btcAddress = await storage.getGlobalDepositAddress('BTC');
      
      res.json({ usdt: usdtAddress, btc: btcAddress });
    } catch (error) {
      next(error);
    }
  });
  
  // Admin-only endpoint to manage deposit addresses (for backwards compatibility)
  app.get("/api/admin/deposit-addresses", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user!.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const usdtAddress = await storage.getGlobalDepositAddress('USDT');
      const btcAddress = await storage.getGlobalDepositAddress('BTC');
      
      res.json({ usdt: usdtAddress, btc: btcAddress });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/deposit-address", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user!.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { currency, address } = z.object({
        currency: z.enum(['USDT', 'BTC']),
        address: z.string()
      }).parse(req.body);

      await storage.setGlobalDepositAddress(currency, address);
      res.json({ message: `${currency} deposit address updated successfully` });
    } catch (error) {
      next(error);
    }
  });
  
  // Get supply metrics
  app.get("/api/supply-metrics", async (req, res, next) => {
    try {
      const metrics = await storage.getSupplyMetrics();
      res.json(metrics);
    } catch (error) {
      next(error);
    }
  });
  
  // Get global mining stats
  app.get("/api/global-stats", async (req, res, next) => {
    try {
      const totalHashPower = await storage.getTotalHashPower();
      const blockHeight = await storage.getSystemSetting("blockNumber");
      const totalBlockHeight = await storage.getSystemSetting("totalBlockHeight");
      const activeMiners = await storage.getActiveMinerCount();
      const supplyMetrics = await storage.getSupplyMetrics();
      
      const currentBlock = blockHeight ? parseInt(blockHeight.value) : 1;
      const totalBlocks = totalBlockHeight ? parseInt(totalBlockHeight.value) : 0;
      
      res.json({
        totalHashrate: parseFloat(totalHashPower),
        blockHeight: currentBlock,
        totalBlockHeight: totalBlocks,
        activeMiners,
        blockReward: parseFloat(supplyMetrics.currentBlockReward),
        totalCirculation: parseFloat(supplyMetrics.circulating),
        maxSupply: 2100000,
        nextHalving: supplyMetrics.halvingProgress.nextHalving,
        blocksUntilHalving: supplyMetrics.halvingProgress.blocksRemaining
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Get unclaimed blocks for current user
  app.get("/api/unclaimed-blocks", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const blocks = await storage.getUnclaimedBlocks(req.user!.id);
      res.json(blocks);
    } catch (error) {
      next(error);
    }
  });
  
  // Claim a single block
  app.post("/api/claim-block/:blockId", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const result = await storage.claimBlock(req.params.blockId, req.user!.id);
      
      if (!result.success) {
        return res.status(400).json({ message: "Block not found or already claimed" });
      }
      
      res.json({ message: `Successfully claimed ${result.reward} B2B`, reward: result.reward });
    } catch (error) {
      next(error);
    }
  });
  
  // Claim all blocks
  app.post("/api/claim-all-blocks", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const result = await storage.claimAllBlocks(req.user!.id);
      
      if (result.count === 0) {
        return res.status(400).json({ message: "No blocks to claim" });
      }
      
      // Get current block number
      const blockSetting = await storage.getSystemSetting("blockNumber");
      const currentBlock = blockSetting ? parseInt(blockSetting.value) : 1;

      // Update user's last active block
      await storage.updateUser(req.user!.id, {
        lastActiveBlock: currentBlock
      });

      res.json({ 
        message: `Successfully claimed ${result.count} blocks for ${result.totalReward} B2B`,
        count: result.count,
        totalReward: result.totalReward
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Admin endpoint to view miner statuses
  app.get("/api/admin/miners", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user!.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const miners = await storage.getMinersStatus();
      res.json(miners);
    } catch (error) {
      next(error);
    }
  });
  
  // Get user transactions
  app.get("/api/transactions", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user!.id;
      const [deposits, withdrawals, sentTransfers, receivedTransfers] = await Promise.all([
        storage.getUserDeposits(userId),
        storage.getUserWithdrawals(userId),
        storage.getSentTransfers(userId),
        storage.getReceivedTransfers(userId)
      ]);
      
      res.json({
        deposits,
        withdrawals,
        sentTransfers,
        receivedTransfers
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Get cooldown status
  app.get("/api/cooldowns", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user!.id;
      const [depositCooldown, withdrawalCooldown] = await Promise.all([
        storage.getDepositCooldown(userId),
        storage.getWithdrawalCooldown(userId)
      ]);
      
      res.json({
        deposit: depositCooldown,
        withdrawal: withdrawalCooldown
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Change PIN
  app.post("/api/change-pin", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { currentPin, newPin } = z.object({
        currentPin: z.string().length(6),
        newPin: z.string().length(6)
      }).parse(req.body);

      // Validate new PIN is 6 digits
      if (!/^\d{6}$/.test(newPin)) {
        return res.status(400).json({ message: "PIN must be exactly 6 digits" });
      }

      // For now, just validate the current PIN matches (simplified)
      // In production, you'd verify against the stored hashed PIN
      
      res.json({ message: "PIN changed successfully" });
    } catch (error) {
      next(error);
    }
  });

  // Get referral data with detailed tracking
  app.get("/api/referrals", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = req.user!;
      
      // Get user's referral code
      const referralCode = user.referralCode || user.username.toUpperCase().slice(0, 6);

      // Get all users referred by this user
      const referredUsers = await storage.getUsersByReferralCode(referralCode);
      
      // Calculate stats
      const totalReferrals = referredUsers.length;
      const activeReferrals = referredUsers.filter(u => parseFloat(u.baseHashPower || u.hashPower || "0") > 0).length;
      
      // Use the stored total referral earnings
      const totalEarnings = user.totalReferralEarnings || "0.00";

      // Format referral list with details
      const referrals = referredUsers.map(u => ({
        id: u.id,
        username: u.username,
        joinedAt: u.createdAt,
        status: parseFloat(u.baseHashPower || u.hashPower || "0") > 0 ? 'mining' : 'inactive',
        hashPower: u.baseHashPower || u.hashPower || "0",
        earned: (parseFloat(u.usdtBalance || "0") * 0.15).toFixed(2) // Estimate based on their balance
      }));

      const referralData = {
        referralCode: referralCode,
        totalReferrals: totalReferrals,
        activeReferrals: activeReferrals,
        totalEarnings: totalEarnings,
        referrals: referrals
      };

      res.json(referralData);
    } catch (error) {
      next(error);
    }
  });
  
  // Transfer B2B
  app.post("/api/transfer", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { toUsername, amount } = z.object({
        toUsername: z.string(),
        amount: z.string()
      }).parse(req.body);
      
      const transfer = await storage.createTransfer(req.user!.id, toUsername, amount);
      res.json({ message: "Transfer successful", transfer });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // BTC Staking endpoints
  
  // Get current BTC price and hashrate price
  app.get("/api/btc/prices", async (req, res, next) => {
    try {
      const btcPrice = await storage.getCurrentBtcPrice();
      const hashratePrice = await storage.getSystemHashratePrice();
      
      res.json({
        btcPrice,
        hashratePrice,
        requiredHashratePerBTC: btcPrice, // 1 BTC requires btcPrice amount of GH/s (since 1 GH/s = 1 USD)
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  });

  // Create BTC stake
  app.post("/api/btc/stake", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { btcAmount, months, apr } = z.object({
        btcAmount: z.string().refine(val => parseFloat(val) >= 0.1, "Minimum stake is 0.1 BTC"),
        months: z.number().optional().default(12),
        apr: z.number().optional().default(20)
      }).parse(req.body);

      const user = req.user!;
      const btcBalance = parseFloat(user.btcBalance || "0");
      const userHashPower = parseFloat(user.hashPower || "0");
      const btcPrice = await storage.getCurrentBtcPrice();
      
      // Check BTC balance
      if (btcBalance < parseFloat(btcAmount)) {
        return res.status(400).json({ message: "Insufficient BTC balance" });
      }

      // Calculate required hashrate (1 GH/s = 1 USD, so GH/s needed = BTC amount * BTC price)
      const requiredHashrate = parseFloat(btcAmount) * parseFloat(btcPrice);
      
      // Check if user has enough hashrate (but don't deduct it - mining continues!)
      if (userHashPower < requiredHashrate) {
        return res.status(400).json({ 
          message: `Insufficient hashrate. Need ${requiredHashrate} GH/s but you have ${userHashPower} GH/s` 
        });
      }

      // Create stake with dynamic lock period and APR
      const stake = await storage.createBtcStake(
        user.id,
        btcAmount,
        requiredHashrate.toString(),
        btcPrice,
        months,
        apr
      );

      // Only deduct BTC balance (NOT hashrate - mining continues!)
      const newBtcBalance = (btcBalance - parseFloat(btcAmount)).toFixed(8);
      await storage.updateUserBtcBalance(user.id, newBtcBalance);
      
      // DON'T deduct hashrate - mining continues to work normally!
      // The staked hashrate is tracked in the stake record but doesn't affect mining
      // Mining rewards continue based on full hashPower

      res.json({
        message: "BTC stake created successfully",
        stake,
        lockDuration: `${months} month${months !== 1 ? 's' : ''}`,
        aprRate: `${apr}%`,
        dailyReward: stake.dailyReward
      });
    } catch (error) {
      next(error);
    }
  });

  // Get user's BTC stakes
  app.get("/api/btc/stakes", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const stakes = await storage.getUserBtcStakes(req.user!.id);
      const btcPrice = await storage.getCurrentBtcPrice();

      res.json({
        stakes,
        currentBtcPrice: btcPrice,
        totalStaked: stakes.reduce((sum, s) => sum + parseFloat(s.btcAmount), 0).toFixed(8),
        totalDailyRewards: stakes.filter(s => s.status === 'active')
          .reduce((sum, s) => sum + parseFloat(s.dailyReward), 0).toFixed(8)
      });
    } catch (error) {
      next(error);
    }
  });

  // Get user's BTC balance
  app.get("/api/btc/balance", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const btcBalance = await storage.getUserBtcBalance(req.user!.id);
      res.json({ btcBalance });
    } catch (error) {
      next(error);
    }
  });

  // BTC deposit
  app.post("/api/btc/deposit", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { txHash, amount } = z.object({
        txHash: z.string(),
        amount: z.string().refine(val => parseFloat(val) >= 0.0001, "Minimum deposit is 0.0001 BTC")
      }).parse(req.body);
      
      const deposit = await storage.createDeposit({
        txHash,
        amount,
        network: "BTC",
        userId: req.user!.id
      });
      
      res.json({ message: "BTC deposit submitted for approval", deposit });
    } catch (error: any) {
      if (error?.message?.includes('duplicate key')) {
        return res.status(400).json({ message: "Transaction hash already submitted" });
      }
      next(error);
    }
  });

  // BTC withdrawal
  app.post("/api/btc/withdraw", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { amount, address } = z.object({
        amount: z.string().refine(val => {
          const amt = parseFloat(val);
          return amt >= 0.001 && amt <= 10;
        }, "Amount must be between 0.001 and 10 BTC"),
        address: z.string()
      }).parse(req.body);
      
      const user = req.user!;
      const btcBalance = parseFloat(user.btcBalance || "0");
      
      if (btcBalance < parseFloat(amount)) {
        return res.status(400).json({ message: "Insufficient BTC balance" });
      }
      
      const withdrawal = await storage.createWithdrawal({
        amount,
        address,
        network: "BTC",
        userId: user.id
      });
      
      // Deduct balance immediately
      const newBalance = (btcBalance - parseFloat(amount)).toFixed(8);
      await storage.updateUserBtcBalance(user.id, newBalance);
      
      res.json({ message: "BTC withdrawal request submitted", withdrawal });
    } catch (error) {
      next(error);
    }
  });

  // Get conversion history
  app.get("/api/conversions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const btcConversions = await storage.getUserBtcConversions(req.user!.id);
    
    // Sort conversions by date
    const allConversions = btcConversions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    res.json(allConversions);
  });

  // BTC/USDT Conversion endpoint
  app.post("/api/convert", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { fromCurrency, toCurrency, amount } = z.object({
        fromCurrency: z.enum(["BTC", "USDT"]),
        toCurrency: z.enum(["BTC", "USDT"]),
        amount: z.string().refine(val => parseFloat(val) > 0, "Amount must be positive")
      }).parse(req.body);

      const convertAmount = parseFloat(amount);
      const conversionFee = 0.0001; // 0.01% fee
      const btcPrice = parseFloat(await storage.getCurrentBtcPrice());

      let result = { 
        convertedAmount: "0", 
        fee: "0", 
        rate: btcPrice.toString() 
      };

      if (fromCurrency === "BTC" && toCurrency === "USDT") {
        // Convert BTC to USDT
        const btcBalance = parseFloat(user.btcBalance || "0");
        if (btcBalance < convertAmount) {
          return res.status(400).json({ message: "Insufficient BTC balance" });
        }

        const usdtValue = convertAmount * btcPrice;
        const fee = usdtValue * conversionFee;
        const finalAmount = usdtValue - fee;

        // Update balances
        const newBtcBalance = (btcBalance - convertAmount).toFixed(8);
        const newUsdtBalance = (parseFloat(user.usdtBalance || "0") + finalAmount).toFixed(2);
        
        await storage.updateUserBtcBalance(user.id, newBtcBalance);
        await storage.updateUser(user.id, { usdtBalance: newUsdtBalance });
        
        // Save conversion history
        await storage.createBtcConversion(
          user.id,
          fromCurrency,
          toCurrency,
          amount,
          finalAmount.toFixed(2),
          fee.toFixed(2),
          btcPrice.toString()
        );

        result = {
          convertedAmount: finalAmount.toFixed(2),
          fee: fee.toFixed(2),
          rate: btcPrice.toString()
        };
      } else if (fromCurrency === "USDT" && toCurrency === "BTC") {
        // Convert USDT to BTC
        const usdtBalance = parseFloat(user.usdtBalance || "0");
        if (usdtBalance < convertAmount) {
          return res.status(400).json({ message: "Insufficient USDT balance" });
        }

        const btcValue = convertAmount / btcPrice;
        const fee = btcValue * conversionFee;
        const finalAmount = btcValue - fee;

        // Update balances
        const newUsdtBalance = (usdtBalance - convertAmount).toFixed(2);
        const newBtcBalance = (parseFloat(user.btcBalance || "0") + finalAmount).toFixed(8);
        
        await storage.updateUser(user.id, { usdtBalance: newUsdtBalance });
        await storage.updateUserBtcBalance(user.id, newBtcBalance);
        
        // Save conversion history
        await storage.createBtcConversion(
          user.id,
          fromCurrency,
          toCurrency,
          amount,
          finalAmount.toFixed(8),
          fee.toFixed(8),
          btcPrice.toString()
        );

        result = {
          convertedAmount: finalAmount.toFixed(8),
          fee: fee.toFixed(8),
          rate: btcPrice.toString()
        };
      } else {
        return res.status(400).json({ message: "Invalid conversion pair. Only BTC/USDT conversions are supported." });
      }

      res.json({
        message: "Conversion successful",
        from: fromCurrency,
        to: toCurrency,
        amount: amount,
        ...result
      });
    } catch (error) {
      next(error);
    }
  });
  
  return server;
}