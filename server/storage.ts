import { 
  users, 
  deposits, 
  withdrawals, 
  miningBlocks, 
  systemSettings,
  unclaimedBlocks,
  minerActivity,
  transfers,
  btcStakes,
  btcStakingRewards,
  btcPriceHistory,
  devices,
  deviceFingerprints,
  userDevices,
  type User, 
  type InsertUser, 
  type Deposit, 
  type InsertDeposit,
  type Withdrawal,
  type InsertWithdrawal,
  type MiningBlock,
  type SystemSetting,
  type UnclaimedBlock,
  type Transfer,
  type MinerActivity,
  type BtcStake,
  type BtcStakingReward,
  type BtcPriceHistory,
  type Device,
  type InsertDevice,
  type DeviceFingerprint,
  type InsertDeviceFingerprint,
  type UserDevice,
  type InsertUserDevice
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByAccessKey(accessKey: string): Promise<User | undefined>;
  getUsersByReferralCode(referralCode: string): Promise<User[]>;
  findUserByOwnReferralCode(referralCode: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  hasIpRegistered(ip: string): Promise<boolean>;
  updateUserBalance(userId: string, usdtBalance: string, hashPower: string, gbtcBalance: string, unclaimedBalance: string): Promise<void>;
  updateUser(userId: string, updates: Partial<User>): Promise<void>;
  freezeUser(userId: string): Promise<void>;
  unfreezeUser(userId: string): Promise<void>;
  banUser(userId: string): Promise<void>;
  unbanUser(userId: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  updateUserBalances(userId: string, balances: { usdtBalance?: string; gbtcBalance?: string; hashPower?: string }): Promise<void>;
  
  // Global deposit address methods
  getGlobalDepositAddress(currency: 'USDT' | 'BTC'): Promise<string>;
  setGlobalDepositAddress(currency: 'USDT' | 'BTC', address: string): Promise<void>;
  
  // Deposit methods
  createDeposit(deposit: InsertDeposit & { userId: string }): Promise<Deposit>;
  getPendingDeposits(): Promise<(Deposit & { user: User })[]>;
  approveDeposit(depositId: string, adminNote?: string, actualAmount?: string): Promise<void>;
  rejectDeposit(depositId: string, adminNote?: string): Promise<void>;
  
  // Withdrawal methods
  createWithdrawal(withdrawal: InsertWithdrawal & { userId: string }): Promise<Withdrawal>;
  getPendingWithdrawals(): Promise<any[]>;
  approveWithdrawal(withdrawalId: string, txHash?: string): Promise<void>;
  rejectWithdrawal(withdrawalId: string): Promise<void>;
  
  // Mining methods
  createMiningBlock(blockNumber: number, reward: string, totalHashPower: string): Promise<MiningBlock>;
  getLatestBlock(): Promise<MiningBlock | undefined>;
  getTotalHashPower(): Promise<string>;
  
  // System settings
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  setSystemSetting(key: string, value: string): Promise<void>;
  
  // Stats
  getUserCount(): Promise<number>;
  getTotalDeposits(): Promise<string>;
  getTotalWithdrawals(): Promise<string>;
  getActiveMinerCount(): Promise<number>;
  
  // Unclaimed blocks
  createUnclaimedBlock(userId: string, blockNumber: number, txHash: string, reward: string): Promise<UnclaimedBlock>;
  getUnclaimedBlocks(userId: string): Promise<any[]>;
  claimBlock(blockId: string, userId: string): Promise<{ success: boolean; reward?: string }>;
  claimAllBlocks(userId: string): Promise<{ count: number; totalReward: string }>;
  expireOldBlocks(): Promise<void>;
  
  // Transfers
  createTransfer(fromUserId: string, toUsername: string, amount: string): Promise<any>;
  
  // Miner activity
  getMinersStatus(): Promise<any[]>;
  updateMinerActivity(userId: string, claimed: boolean): Promise<void>;
  
  // Transaction fetching methods
  getUserDeposits(userId: string): Promise<Deposit[]>;
  getUserWithdrawals(userId: string): Promise<Withdrawal[]>;
  getSentTransfers(userId: string): Promise<Transfer[]>;
  getReceivedTransfers(userId: string): Promise<Transfer[]>;
  
  // Cooldown methods
  getDepositCooldown(userId: string): Promise<{ canDeposit: boolean; hoursRemaining: number }>;
  getWithdrawalCooldown(userId: string): Promise<{ canWithdraw: boolean; hoursRemaining: number }>;
  
  // Supply tracking methods
  getTotalMinedSupply(): Promise<string>;
  getCirculatingSupply(): Promise<string>;
  getSupplyMetrics(): Promise<{
    totalMined: string;
    circulating: string;
    maxSupply: string;
    percentageMined: string;
    currentBlockReward: string;
    totalBlocks: number;
    halvingProgress: { current: number; nextHalving: number; blocksRemaining: number };
  }>;
  
  // Conversion tracking
  createBtcConversion(userId: string, fromCurrency: string, toCurrency: string, fromAmount: string, toAmount: string, fee: string, rate: string): Promise<any>;
  getUserBtcConversions(userId: string): Promise<any[]>;
  
  // BTC Staking operations
  createBtcStake(userId: string, btcAmount: string, gbtcHashrate: string, btcPrice: string, months?: number, apr?: number): Promise<any>;
  getUserBtcStakes(userId: string): Promise<any[]>;
  getActiveBtcStakes(): Promise<any[]>;
  processDailyBtcRewards(): Promise<void>;
  getCurrentBtcPrice(): Promise<string>;
  updateBtcPrice(price: string, source?: string): Promise<void>;
  getSystemHashratePrice(): Promise<string>; // Price of 1 GH/s in BTC
  getUserBtcBalance(userId: string): Promise<string>;
  updateUserBtcBalance(userId: string, btcBalance: string): Promise<void>;

  // Device Fingerprinting methods
  upsertDevice(deviceData: { 
    serverDeviceId: string; 
    lastIp?: string; 
    asn?: string; 
    fingerprints: InsertDeviceFingerprint 
  }): Promise<{ device: Device; canRegister: boolean }>;
  findMatchingDevice(fingerprints: Omit<InsertDeviceFingerprint, 'deviceId'>): Promise<Device | null>;
  linkUserToDevice(userId: string, deviceId: string): Promise<void>;
  blockDevice(deviceId: string): Promise<void>;
  allowlistDevice(deviceId: string, maxRegistrations?: number): Promise<void>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Use in-memory session store to avoid PostgreSQL session table issues
    this.sessionStore = new session.MemoryStore();
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByAccessKey(accessKey: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.accessKey, accessKey));
    return user || undefined;
  }

  async getUsersByReferralCode(referralCode: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.referredBy, referralCode));
  }

  async findUserByOwnReferralCode(referralCode: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.referralCode, referralCode)).limit(1);
    return result[0] || null;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async hasIpRegistered(ip: string): Promise<boolean> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.registrationIp, ip))
      .limit(1);
    return result.length > 0;
  }

  async updateUserBalance(userId: string, usdtBalance: string, hashPower: string, gbtcBalance: string, unclaimedBalance: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        usdtBalance, 
        hashPower, 
        gbtcBalance, 
        unclaimedBalance 
      })
      .where(eq(users.id, userId));
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId));
  }

  async freezeUser(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ isFrozen: true })
      .where(eq(users.id, userId));
  }

  async unfreezeUser(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ isFrozen: false })
      .where(eq(users.id, userId));
  }

  async banUser(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ isBanned: true })
      .where(eq(users.id, userId));
  }

  async unbanUser(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ isBanned: false })
      .where(eq(users.id, userId));
  }

  async getGlobalDepositAddress(currency: 'USDT' | 'BTC'): Promise<string> {
    const key = `${currency}_DEPOSIT_ADDRESS`;
    const setting = await this.getSystemSetting(key);
    if (currency === 'BTC') {
      return setting?.value || 'bc1qy8zzqsarhp0s63txsfnn3q3nvuu0g83mv3hwrv';
    }
    return setting?.value || 'TBGxYmP3tFrbKvJRvQcF9cENKixQeJdfQc';
  }

  async setGlobalDepositAddress(currency: 'USDT' | 'BTC', address: string): Promise<void> {
    const key = `${currency}_DEPOSIT_ADDRESS`;
    await this.setSystemSetting(key, address);
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserBalances(userId: string, balances: { usdtBalance?: string; gbtcBalance?: string; hashPower?: string }): Promise<void> {
    const updates: any = {};
    if (balances.usdtBalance !== undefined) updates.usdtBalance = balances.usdtBalance;
    if (balances.gbtcBalance !== undefined) updates.gbtcBalance = balances.gbtcBalance;
    if (balances.hashPower !== undefined) updates.hashPower = balances.hashPower;
    
    await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId));
  }

  async createDeposit(deposit: InsertDeposit & { userId: string }): Promise<Deposit> {
    const [newDeposit] = await db
      .insert(deposits)
      .values(deposit)
      .returning();
    return newDeposit;
  }

  async getPendingDeposits(): Promise<(Deposit & { user: User })[]> {
    const result = await db
      .select()
      .from(deposits)
      .innerJoin(users, eq(deposits.userId, users.id))
      .where(eq(deposits.status, "pending"))
      .orderBy(desc(deposits.createdAt));
    
    return result.map(row => ({
      ...row.deposits,
      user: row.users
    }));
  }

  async approveDeposit(depositId: string, adminNote?: string, actualAmount?: string): Promise<void> {
    // Get the deposit first
    const [deposit] = await db
      .select()
      .from(deposits)
      .where(eq(deposits.id, depositId));
    
    if (!deposit) throw new Error("Deposit not found");
    
    // Use actualAmount if provided (admin verified amount), otherwise use original amount
    const amountToCredit = actualAmount || deposit.amount;
    
    // Update deposit status and amount if actualAmount provided
    await db
      .update(deposits)
      .set({ 
        status: "approved", 
        adminNote, 
        amount: amountToCredit,
        updatedAt: new Date() 
      })
      .where(eq(deposits.id, depositId));
    
    // Update user balance with the verified amount
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, deposit.userId));
    
    if (user) {
      // Update USDT balance for all deposits (BTC mining platform supports USDT deposits only)
      const newBalance = (parseFloat(user.usdtBalance || "0") + parseFloat(amountToCredit)).toFixed(2);
      await db
        .update(users)
        .set({ usdtBalance: newBalance })
        .where(eq(users.id, deposit.userId));
    }
  }

  async rejectDeposit(depositId: string, adminNote?: string): Promise<void> {
    await db
      .update(deposits)
      .set({ status: "rejected", adminNote, updatedAt: new Date() })
      .where(eq(deposits.id, depositId));
  }

  async createWithdrawal(withdrawal: InsertWithdrawal & { userId: string }): Promise<Withdrawal> {
    const [newWithdrawal] = await db
      .insert(withdrawals)
      .values({
        ...withdrawal,
        status: 'pending' // All withdrawals start as pending
      })
      .returning();
    return newWithdrawal;
  }

  async getPendingWithdrawals(): Promise<any[]> {
    const result = await db
      .select({
        id: withdrawals.id,
        userId: withdrawals.userId,
        amount: withdrawals.amount,
        address: withdrawals.address,
        network: withdrawals.network,
        status: withdrawals.status,
        txHash: withdrawals.txHash,
        createdAt: withdrawals.createdAt,
        user: users
      })
      .from(withdrawals)
      .innerJoin(users, eq(withdrawals.userId, users.id))
      .where(eq(withdrawals.status, "pending"))
      .orderBy(desc(withdrawals.createdAt));
    
    return result;
  }

  async approveWithdrawal(withdrawalId: string, txHash?: string): Promise<void> {
    // Get the withdrawal details first
    const [withdrawal] = await db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.id, withdrawalId));
    
    if (!withdrawal) {
      throw new Error("Withdrawal not found");
    }

    // Get the user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, withdrawal.userId));
    
    if (!user) {
      throw new Error("User not found");
    }

    const amount = parseFloat(withdrawal.amount);
    const isUSDT = withdrawal.network === 'ERC20' || withdrawal.network === 'BSC' || withdrawal.network === 'TRC20';

    // Check balance and deduct
    if (isUSDT) {
      const usdtBalance = parseFloat(user.usdtBalance || "0");
      if (usdtBalance < amount) {
        throw new Error("Insufficient USDT balance");
      }
      const newBalance = (usdtBalance - amount).toFixed(2);
      await db.update(users)
        .set({ usdtBalance: newBalance })
        .where(eq(users.id, user.id));
    } else {
      const gbtcBalance = parseFloat(user.gbtcBalance || "0");
      if (gbtcBalance < amount) {
        throw new Error("Insufficient B2B balance");
      }
      const newBalance = (gbtcBalance - amount).toFixed(8);
      await db.update(users)
        .set({ gbtcBalance: newBalance })
        .where(eq(users.id, user.id));
    }

    // Update withdrawal status
    await db.update(withdrawals)
      .set({ 
        status: "completed",
        txHash: txHash || null
      })
      .where(eq(withdrawals.id, withdrawalId));
  }

  async rejectWithdrawal(withdrawalId: string): Promise<void> {
    await db.update(withdrawals)
      .set({ status: "rejected" })
      .where(eq(withdrawals.id, withdrawalId));
  }

  async createMiningBlock(blockNumber: number, reward: string, totalHashPower: string): Promise<MiningBlock> {
    const [block] = await db
      .insert(miningBlocks)
      .values({ blockNumber, reward, totalHashPower })
      .returning();
    return block;
  }

  async getLatestBlock(): Promise<MiningBlock | undefined> {
    const [block] = await db
      .select()
      .from(miningBlocks)
      .orderBy(desc(miningBlocks.blockNumber))
      .limit(1);
    return block || undefined;
  }

  async getTotalHashPower(): Promise<string> {
    const [result] = await db
      .select({ total: sql<string>`COALESCE(SUM(${users.hashPower}), 0)` })
      .from(users);
    return result?.total || "0";
  }

  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key));
    return setting || undefined;
  }

  async setSystemSetting(key: string, value: string): Promise<void> {
    await db
      .insert(systemSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value, updatedAt: new Date() }
      });
  }

  async getUserCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users);
    return result?.count || 0;
  }

  async getTotalDeposits(): Promise<string> {
    const [result] = await db
      .select({ total: sql<string>`COALESCE(SUM(${deposits.amount}), 0)` })
      .from(deposits)
      .where(eq(deposits.status, "approved"));
    return result?.total || "0";
  }

  async getTotalWithdrawals(): Promise<string> {
    const [result] = await db
      .select({ total: sql<string>`COALESCE(SUM(${withdrawals.amount}), 0)` })
      .from(withdrawals)
      .where(eq(withdrawals.status, "completed"));
    return result?.total || "0";
  }
  
  async createUnclaimedBlock(userId: string, blockNumber: number, txHash: string, reward: string): Promise<UnclaimedBlock> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    const [block] = await db.insert(unclaimedBlocks).values({
      userId,
      blockNumber,
      txHash,
      reward,
      expiresAt
    }).returning();
    return block;
  }
  
  async getUnclaimedBlocks(userId: string): Promise<UnclaimedBlock[]> {
    return await db.select()
      .from(unclaimedBlocks)
      .where(sql`${unclaimedBlocks.userId} = ${userId} AND ${unclaimedBlocks.claimed} = false AND ${unclaimedBlocks.expiresAt} > NOW()`)
      .orderBy(desc(unclaimedBlocks.createdAt));
  }
  
  async claimBlock(blockId: string, userId: string): Promise<{ success: boolean; reward?: string }> {
    const [block] = await db.select()
      .from(unclaimedBlocks)
      .where(sql`${unclaimedBlocks.id} = ${blockId} AND ${unclaimedBlocks.userId} = ${userId} AND ${unclaimedBlocks.claimed} = false AND ${unclaimedBlocks.expiresAt} > NOW()`);
    
    if (!block) {
      return { success: false };
    }
    
    await db.update(unclaimedBlocks)
      .set({ claimed: true, claimedAt: new Date() })
      .where(eq(unclaimedBlocks.id, blockId));
    
    const user = await this.getUser(userId);
    if (user) {
      const newBalance = (parseFloat(user.gbtcBalance || "0") + parseFloat(block.reward)).toFixed(8);
      await db.update(users)
        .set({ gbtcBalance: newBalance })
        .where(eq(users.id, userId));
    }
    
    await this.updateMinerActivity(userId, true);
    
    return { success: true, reward: block.reward };
  }
  
  async claimAllBlocks(userId: string): Promise<{ count: number; totalReward: string }> {
    const blocks = await db.select()
      .from(unclaimedBlocks)
      .where(sql`${unclaimedBlocks.userId} = ${userId} AND ${unclaimedBlocks.claimed} = false AND ${unclaimedBlocks.expiresAt} > NOW()`);
    
    if (blocks.length === 0) {
      return { count: 0, totalReward: '0' };
    }
    
    // Calculate total reward
    let totalReward = 0;
    for (const block of blocks) {
      totalReward += parseFloat(block.reward);
    }
    
    // Mark all blocks as claimed
    await db.update(unclaimedBlocks)
      .set({ claimed: true, claimedAt: new Date() })
      .where(sql`${unclaimedBlocks.userId} = ${userId} AND ${unclaimedBlocks.claimed} = false AND ${unclaimedBlocks.expiresAt} > NOW()`);
    
    // Update user balance
    const user = await this.getUser(userId);
    if (user) {
      const newBalance = (parseFloat(user.gbtcBalance || "0") + totalReward).toFixed(8);
      await db.update(users)
        .set({ gbtcBalance: newBalance })
        .where(eq(users.id, userId));
    }
    
    await this.updateMinerActivity(userId, true);
    
    return { 
      count: blocks.length, 
      totalReward: totalReward.toFixed(8) 
    };
  }
  
  async expireOldBlocks(): Promise<void> {
    const expiredBlocks = await db.select()
      .from(unclaimedBlocks)
      .where(sql`${unclaimedBlocks.claimed} = false AND ${unclaimedBlocks.expiresAt} <= NOW()`);
    
    for (const block of expiredBlocks) {
      await this.updateMinerActivity(block.userId, false);
    }
  }
  
  async createTransfer(fromUserId: string, toUsername: string, amount: string): Promise<Transfer> {
    const toUser = await this.getUserByUsername(toUsername);
    if (!toUser) {
      throw new Error('Recipient not found');
    }
    
    const fromUser = await this.getUser(fromUserId);
    if (!fromUser) {
      throw new Error('Sender not found');
    }
    
    const senderBalance = parseFloat(fromUser.gbtcBalance || "0");
    if (senderBalance < parseFloat(amount)) {
      throw new Error('Insufficient balance');
    }
    
    await db.update(users)
      .set({ gbtcBalance: (senderBalance - parseFloat(amount)).toFixed(8) })
      .where(eq(users.id, fromUserId));
    
    await db.update(users)
      .set({ gbtcBalance: (parseFloat(toUser.gbtcBalance || "0") + parseFloat(amount)).toFixed(8) })
      .where(eq(users.id, toUser.id));
    
    const txHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    const [transfer] = await db.insert(transfers).values({
      fromUserId,
      toUserId: toUser.id,
      amount,
      txHash
    }).returning();
    
    return transfer;
  }
  
  async updateMinerActivity(userId: string, claimed: boolean): Promise<void> {
    const [activity] = await db.select()
      .from(minerActivity)
      .where(eq(minerActivity.userId, userId));
    
    if (!activity) {
      await db.insert(minerActivity).values({
        userId,
        lastClaimTime: claimed ? new Date() : null,
        totalClaims: claimed ? 1 : 0,
        missedClaims: claimed ? 0 : 1,
        isActive: claimed
      });
    } else {
      const now = new Date();
      const lastClaim = activity.lastClaimTime ? new Date(activity.lastClaimTime) : null;
      const hoursSinceLastClaim = lastClaim ? (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60) : 999;
      
      await db.update(minerActivity)
        .set({
          lastClaimTime: claimed ? now : activity.lastClaimTime,
          totalClaims: claimed ? (activity.totalClaims || 0) + 1 : (activity.totalClaims || 0),
          missedClaims: claimed ? (activity.missedClaims || 0) : (activity.missedClaims || 0) + 1,
          isActive: hoursSinceLastClaim < 48,
          updatedAt: now
        })
        .where(eq(minerActivity.userId, userId));
    }
  }
  
  async getMinersStatus(): Promise<(MinerActivity & { user: User })[]> {
    const result = await db.select({
      minerActivity,
      user: users
    })
    .from(minerActivity)
    .leftJoin(users, eq(minerActivity.userId, users.id));
    
    return result.map(r => ({
      ...r.minerActivity,
      user: r.user!
    }));
  }
  
  async getActiveMinerCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(minerActivity)
      .where(eq(minerActivity.isActive, true));
    return result?.count || 0;
  }
  
  async getUserDeposits(userId: string): Promise<Deposit[]> {
    return await db
      .select()
      .from(deposits)
      .where(eq(deposits.userId, userId))
      .orderBy(desc(deposits.createdAt));
  }
  
  async getUserWithdrawals(userId: string): Promise<Withdrawal[]> {
    return await db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.userId, userId))
      .orderBy(desc(withdrawals.createdAt));
  }
  
  async getSentTransfers(userId: string): Promise<Transfer[]> {
    const result = await db
      .select({
        transfer: transfers,
        toUser: users
      })
      .from(transfers)
      .leftJoin(users, eq(transfers.toUserId, users.id))
      .where(eq(transfers.fromUserId, userId))
      .orderBy(desc(transfers.createdAt));
    
    return result.map(r => ({
      ...r.transfer,
      toUsername: r.toUser?.username || 'Unknown'
    }));
  }
  
  async getReceivedTransfers(userId: string): Promise<Transfer[]> {
    const result = await db
      .select({
        transfer: transfers,
        fromUser: users
      })
      .from(transfers)
      .leftJoin(users, eq(transfers.fromUserId, users.id))
      .where(eq(transfers.toUserId, userId))
      .orderBy(desc(transfers.createdAt));
    
    return result.map(r => ({
      ...r.transfer,
      fromUsername: r.fromUser?.username || 'Unknown'
    }));
  }
  
  // For database storage, we'll return no cooldown for now (could be extended later)
  async getDepositCooldown(userId: string): Promise<{ canDeposit: boolean; hoursRemaining: number }> {
    return { canDeposit: true, hoursRemaining: 0 };
  }
  
  async getWithdrawalCooldown(userId: string): Promise<{ canWithdraw: boolean; hoursRemaining: number }> {
    return { canWithdraw: true, hoursRemaining: 0 };
  }
  
  // Supply tracking methods implementation
  async getTotalMinedSupply(): Promise<string> {
    try {
      // Get all mined blocks to calculate total mined supply
      const blocks = await db.select().from(miningBlocks);
      const totalMined = blocks.reduce((sum, block) => {
        return sum + parseFloat(block.reward || "0");
      }, 0);
      return totalMined.toFixed(8);
    } catch (error) {
      console.error("Error getting total mined supply:", error);
      return "0";
    }
  }
  
  async getCirculatingSupply(): Promise<string> {
    try {
      // Circulating supply = All B2B in user wallets (not unclaimed)
      const allUsers = await db.select().from(users);
      const circulatingSupply = allUsers.reduce((sum, user) => {
        return sum + parseFloat(user.gbtcBalance || "0");
      }, 0);
      return circulatingSupply.toFixed(8);
    } catch (error) {
      console.error("Error getting circulating supply:", error);
      return "0";
    }
  }
  
  async getSupplyMetrics(): Promise<{
    totalMined: string;
    circulating: string;
    maxSupply: string;
    percentageMined: string;
    currentBlockReward: string;
    totalBlocks: number;
    halvingProgress: { current: number; nextHalving: number; blocksRemaining: number };
  }> {
    try {
      const MAX_SUPPLY = 2100000; // 2.1M B2B max supply
      const HALVING_INTERVAL = 4200; // Blocks between halvings
      
      // Get total mined supply
      const totalMined = await this.getTotalMinedSupply();
      
      // Get circulating supply
      const circulating = await this.getCirculatingSupply();
      
      // Get current block reward
      const blockRewardSetting = await this.getSystemSetting("blockReward");
      const currentBlockReward = blockRewardSetting ? blockRewardSetting.value : "50";
      
      // Get total blocks mined
      const totalBlockHeightSetting = await this.getSystemSetting("totalBlockHeight");
      const totalBlocks = totalBlockHeightSetting ? parseInt(totalBlockHeightSetting.value) : 0;
      
      // Calculate halving progress
      const currentHalvingPeriod = Math.floor(totalBlocks / HALVING_INTERVAL);
      const nextHalving = (currentHalvingPeriod + 1) * HALVING_INTERVAL;
      const blocksRemaining = nextHalving - totalBlocks;
      
      // Calculate percentage mined
      const percentageMined = ((parseFloat(totalMined) / MAX_SUPPLY) * 100).toFixed(2);
      
      return {
        totalMined,
        circulating,
        maxSupply: MAX_SUPPLY.toString(),
        percentageMined,
        currentBlockReward,
        totalBlocks,
        halvingProgress: {
          current: currentHalvingPeriod,
          nextHalving,
          blocksRemaining
        }
      };
    } catch (error) {
      console.error("Error getting supply metrics:", error);
      return {
        totalMined: "0",
        circulating: "0",
        maxSupply: "2100000",
        percentageMined: "0",
        currentBlockReward: "50",
        totalBlocks: 0,
        halvingProgress: { current: 0, nextHalving: 4200, blocksRemaining: 4200 }
      };
    }
  }
  
  // Conversion tracking - memory based for now
  private btcConversions = new Map<string, any[]>();
  
  async createBtcConversion(userId: string, fromCurrency: string, toCurrency: string, fromAmount: string, toAmount: string, fee: string, rate: string): Promise<any> {
    const conversionId = 'conv-' + Math.random().toString(36).substring(7);
    const conversion = {
      id: conversionId,
      userId,
      fromCurrency,
      toCurrency,
      fromAmount,
      toAmount,
      fee,
      rate,
      createdAt: new Date()
    };
    
    if (!this.btcConversions.has(userId)) {
      this.btcConversions.set(userId, []);
    }
    this.btcConversions.get(userId)!.push(conversion);
    return conversion;
  }
  
  async getUserBtcConversions(userId: string): Promise<any[]> {
    return this.btcConversions.get(userId) || [];
  }

  // BTC Staking methods
  async createBtcStake(userId: string, btcAmount: string, gbtcHashrate: string, btcPrice: string, months: number = 12, apr: number = 20): Promise<any> {
    const dailyReward = (parseFloat(btcAmount) * apr / 100 / 365).toFixed(8); // Dynamic APR daily
    const unlockAt = new Date();
    unlockAt.setMonth(unlockAt.getMonth() + months); // Dynamic lock period

    const [stake] = await db.insert(btcStakes).values({
      userId,
      btcAmount,
      gbtcHashrate,
      btcPriceAtStake: btcPrice,
      dailyReward,
      unlockAt,
    }).returning();

    return stake;
  }

  async getUserBtcStakes(userId: string): Promise<any[]> {
    const stakes = await db
      .select()
      .from(btcStakes)
      .where(eq(btcStakes.userId, userId))
      .orderBy(desc(btcStakes.stakedAt));

    return stakes;
  }

  async getActiveBtcStakes(): Promise<any[]> {
    const stakes = await db
      .select()
      .from(btcStakes)
      .where(eq(btcStakes.status, 'active'));

    return stakes;
  }

  async processDailyBtcRewards(): Promise<void> {
    const activeStakes = await this.getActiveBtcStakes();
    const currentBtcPrice = await this.getCurrentBtcPrice();

    for (const stake of activeStakes) {
      // Pay daily reward
      await db.insert(btcStakingRewards).values({
        stakeId: stake.id,
        userId: stake.userId,
        rewardAmount: stake.dailyReward,
        btcPrice: currentBtcPrice,
      });

      // Update user BTC balance
      const user = await this.getUser(stake.userId);
      if (user) {
        const newBtcBalance = (parseFloat(user.btcBalance || '0') + parseFloat(stake.dailyReward)).toFixed(8);
        await this.updateUserBtcBalance(stake.userId, newBtcBalance);
      }

      // Update stake's total rewards paid and last reward time
      await db
        .update(btcStakes)
        .set({
          totalRewardsPaid: (parseFloat(stake.totalRewardsPaid) + parseFloat(stake.dailyReward)).toFixed(8),
          lastRewardAt: new Date(),
        })
        .where(eq(btcStakes.id, stake.id));
    }
  }

  async getCurrentBtcPrice(): Promise<string> {
    // Get latest BTC price from history
    const [latestPrice] = await db
      .select()
      .from(btcPriceHistory)
      .orderBy(desc(btcPriceHistory.timestamp))
      .limit(1);

    if (latestPrice) {
      return latestPrice.price;
    }

    // If no price history, fetch from API
    const price = await fetchRealBtcPrice();
    await this.updateBtcPrice(price, 'api');
    return price;
  }

  async updateBtcPrice(price: string, source: string = 'system'): Promise<void> {
    await db.insert(btcPriceHistory).values({
      price,
      source,
    });
  }

  async getSystemHashratePrice(): Promise<string> {
    // Calculate price of 1 GH/s based on BTC price
    const btcPrice = await this.getCurrentBtcPrice();
    // 1 BTC worth of hashrate = btcPrice / 1000 (assuming 1000 GH/s = 1 BTC equivalent)
    const pricePerGH = (parseFloat(btcPrice) / 1000).toFixed(8);
    return pricePerGH;
  }

  async getUserBtcBalance(userId: string): Promise<string> {
    const user = await this.getUser(userId);
    return user?.btcBalance || '0.00000000';
  }

  async updateUserBtcBalance(userId: string, btcBalance: string): Promise<void> {
    await db
      .update(users)
      .set({ btcBalance })
      .where(eq(users.id, userId));
  }

  // Device Fingerprinting methods
  async upsertDevice(deviceData: { 
    serverDeviceId: string; 
    lastIp?: string; 
    asn?: string; 
    fingerprints: InsertDeviceFingerprint 
  }): Promise<{ device: Device; canRegister: boolean }> {
    const { serverDeviceId, lastIp, asn, fingerprints } = deviceData;
    
    // Check if device already exists
    let [device] = await db
      .select()
      .from(devices)
      .where(eq(devices.serverDeviceId, serverDeviceId));

    if (!device) {
      // Check for matching fingerprints first
      const matchingDevice = await this.findMatchingDevice(fingerprints);
      
      if (matchingDevice) {
        // Update existing device with new serverDeviceId
        await db
          .update(devices)
          .set({ 
            serverDeviceId, 
            lastSeen: new Date(),
            lastIp: lastIp || null,
            asn: asn || null
          })
          .where(eq(devices.id, matchingDevice.id));
        
        device = { ...matchingDevice, serverDeviceId, lastSeen: new Date(), lastIp: lastIp || null, asn: asn || null };
      } else {
        // Create new device
        [device] = await db
          .insert(devices)
          .values({
            serverDeviceId,
            lastIp: lastIp || null,
            asn: asn || null,
          })
          .returning();
      }

      // Add fingerprints
      await db
        .insert(deviceFingerprints)
        .values({
          ...fingerprints,
          deviceId: device.id,
        });
    } else {
      // Update existing device
      await db
        .update(devices)
        .set({ 
          lastSeen: new Date(),
          lastIp: lastIp || null,
          asn: asn || null
        })
        .where(eq(devices.id, device.id));
    }

    const canRegister = !device.blocked && device.registrations === 0;
    return { device, canRegister };
  }

  async findMatchingDevice(fingerprints: Omit<InsertDeviceFingerprint, 'deviceId'>): Promise<Device | null> {
    // Check for exact stable hash match (highest confidence)
    if (fingerprints.stableHash) {
      const exactMatch = await db
        .select({ device: devices })
        .from(deviceFingerprints)
        .innerJoin(devices, eq(deviceFingerprints.deviceId, devices.id))
        .where(eq(deviceFingerprints.stableHash, fingerprints.stableHash))
        .limit(1);
      
      if (exactMatch.length > 0) {
        return exactMatch[0].device;
      }
    }

    // Check for WebGL + Fonts combination (high confidence)
    if (fingerprints.webglHash && fingerprints.fontsHash) {
      const webglFontsMatch = await db
        .select({ device: devices })
        .from(deviceFingerprints)
        .innerJoin(devices, eq(deviceFingerprints.deviceId, devices.id))
        .where(sql`${deviceFingerprints.webglHash} = ${fingerprints.webglHash} AND ${deviceFingerprints.fontsHash} = ${fingerprints.fontsHash}`)
        .limit(1);
      
      if (webglFontsMatch.length > 0) {
        return webglFontsMatch[0].device;
      }
    }

    return null;
  }

  async linkUserToDevice(userId: string, deviceId: string): Promise<void> {
    // Check if link already exists
    const existing = await db
      .select()
      .from(userDevices)
      .where(sql`${userDevices.userId} = ${userId} AND ${userDevices.deviceId} = ${deviceId}`)
      .limit(1);

    if (existing.length === 0) {
      await db
        .insert(userDevices)
        .values({ userId, deviceId });
    }

    // Increment device registration count
    await db
      .update(devices)
      .set({ 
        registrations: sql`${devices.registrations} + 1`
      })
      .where(eq(devices.id, deviceId));
  }

  async blockDevice(deviceId: string): Promise<void> {
    await db
      .update(devices)
      .set({ blocked: true })
      .where(eq(devices.id, deviceId));
  }

  async allowlistDevice(deviceId: string, maxRegistrations: number = 2): Promise<void> {
    await db
      .update(devices)
      .set({ 
        blocked: false,
        registrations: 0 // Reset registrations for allowlisted device
      })
      .where(eq(devices.id, deviceId));
  }
}

import { MemoryStorage } from "./memoryStorage";

// Cache for BTC price to avoid rate limiting
let btcPriceCache: { price: string; timestamp: number } | null = null;
const CACHE_DURATION = 30000; // Cache for 30 seconds

// Helper function to fetch real BTC price
export async function fetchRealBtcPrice(): Promise<string> {
  try {
    // Check cache first
    if (btcPriceCache && Date.now() - btcPriceCache.timestamp < CACHE_DURATION) {
      return btcPriceCache.price;
    }

    // Fetch from CoinGecko's free API (no API key required)
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    
    if (!response.ok) {
      throw new Error('Failed to fetch BTC price');
    }
    
    const data = await response.json();
    const price = data.bitcoin?.usd;
    
    if (!price) {
      throw new Error('Invalid price data');
    }
    
    // Cache the price
    btcPriceCache = {
      price: price.toFixed(2),
      timestamp: Date.now()
    };
    
    return price.toFixed(2);
  } catch (error) {
    console.error('Error fetching BTC price:', error);
    // Fallback to a reasonable default if API fails
    return "98000.00";
  }
}

// Storage variables will be initialized during server startup

async function testDatabaseConnection(): Promise<boolean> {
  try {
    const testStorage = new DatabaseStorage();
    // Try a simple query to test if database is accessible
    await testStorage.getSystemSetting("test");
    return true;
  } catch (error: any) {
    if (error?.message?.includes('endpoint has been disabled') || error?.code === 'XX000') {
      return false;
    }
    // For other errors, we might still want to try database
    return true;
  }
}

// Initialize storage with fallback
async function initializeStorage() {
  const dbAvailable = await testDatabaseConnection();
  
  if (dbAvailable) {
    // Using PostgreSQL database
    storage = new DatabaseStorage();
    isUsingMemoryStorage = false;
  } else {
    // Using in-memory storage - default accounts created
    storage = new MemoryStorage();
    isUsingMemoryStorage = true;
  }
}

// Initialize storage (will be set during server startup)
let storage: IStorage;
let isUsingMemoryStorage = false;

// Export the initialization function to be called during server startup
export async function initStorage() {
  const dbAvailable = await testDatabaseConnection();
  
  if (dbAvailable) {
    // Using PostgreSQL database
    storage = new DatabaseStorage();
    isUsingMemoryStorage = false;
  } else {
    // Using in-memory storage - default accounts created
    storage = new MemoryStorage();
    isUsingMemoryStorage = true;
  }
  
  return storage;
}

export { storage, isUsingMemoryStorage };
