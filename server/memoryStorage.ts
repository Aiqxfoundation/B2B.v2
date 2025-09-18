import { 
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
  type Device,
  type InsertDevice,
  type DeviceFingerprint,
  type InsertDeviceFingerprint,
  type UserDevice,
  type InsertUserDevice
} from "@shared/schema";
import { IStorage } from "./storage";
import session from "express-session";
import MemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const MemoryStoreSession = MemoryStore(session);

export class MemoryStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private usersByUsername: Map<string, string> = new Map(); // username -> userId
  private deposits: Map<string, Deposit> = new Map();
  private withdrawals: Map<string, Withdrawal> = new Map();
  private miningBlocks: Map<string, MiningBlock> = new Map();
  private btcPriceCache: { price: string; timestamp: number } | null = null;
  private readonly PRICE_CACHE_DURATION = 30000; // 30 seconds cache
  private systemSettings: Map<string, SystemSetting> = new Map();
  private unclaimedBlocks: Map<string, UnclaimedBlock> = new Map();
  private transfers: Map<string, Transfer> = new Map();
  private minerActivity: Map<string, MinerActivity> = new Map();
  private lastDepositTime: Map<string, Date> = new Map(); // userId -> last deposit timestamp
  private lastWithdrawalTime: Map<string, Date> = new Map(); // userId -> last withdrawal timestamp
  private btcConversions: Map<string, any[]> = new Map(); // userId -> BTC/USDT conversions
  
  // Device fingerprinting storage
  private devices: Map<string, Device> = new Map(); // deviceId -> Device
  private devicesByServerDeviceId: Map<string, string> = new Map(); // serverDeviceId -> deviceId  
  private deviceFingerprints: Map<string, DeviceFingerprint[]> = new Map(); // deviceId -> fingerprints[]
  private userDevices: Map<string, string[]> = new Map(); // userId -> deviceId[]
  
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize default admin user
    this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    // Create default admin user
    const adminId = 'admin-' + randomBytes(8).toString('hex');
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync('123456', salt, 64)) as Buffer;
    const hashedPassword = `${buf.toString("hex")}.${salt}`;
    
    const adminUser: User = {
      id: adminId,
      username: 'admin',
      password: hashedPassword,
      referralCode: 'ADM1N0X7',
      referredBy: null,
      usdtBalance: '10000.00',

      btcBalance: '10.00000000',  // Added BTC balance for testing
      hashPower: '1104.50', // 1000 base + 104.5 bonus from referrals (increased for staking)
      baseHashPower: '1000.00',
      referralHashBonus: '104.50', // 5% of 90 TH/s from 3 referrals
      gbtcBalance: '50.00000000',  // Added GBTC balance for testing
      unclaimedBalance: '0.00000000',
      totalReferralEarnings: '0.00',
      lastActiveBlock: 0,
      isAdmin: true,
      isFrozen: false,
      isBanned: false,
      createdAt: new Date()
    };
    
    this.users.set(adminId, adminUser);
    this.usersByUsername.set('admin', adminId);
    
    // Create tempuser for testing
    const tempUserId = 'user-temp' + randomBytes(6).toString('hex');
    const tempBuf = (await scryptAsync('123456', salt, 64)) as Buffer;
    const tempHashedPassword = `${tempBuf.toString("hex")}.${salt}`;
    
    const tempUser: User = {
      id: tempUserId,
      username: 'tempuser',
      password: tempHashedPassword,
      referralCode: 'TEMP1234',
      referredBy: null,
      usdtBalance: '1000.00',

      btcBalance: '0.50000000',
      hashPower: '10.00',
      baseHashPower: '10.00',
      referralHashBonus: '0.00',
      gbtcBalance: '5.00000000',
      unclaimedBalance: '0.00000000',
      totalReferralEarnings: '0.00',
      lastActiveBlock: 0,
      isAdmin: false,
      isFrozen: false,
      isBanned: false,
      createdAt: new Date()
    };
    
    this.users.set(tempUserId, tempUser);
    this.usersByUsername.set('tempuser', tempUserId);
    
    // Create test referral users for admin
    for (let i = 1; i <= 3; i++) {
      const refUserId = 'user-ref' + i + randomBytes(6).toString('hex');
      const refBuf = (await scryptAsync('123456', salt, 64)) as Buffer;
      const refHashedPassword = `${refBuf.toString("hex")}.${salt}`;
      
      // Generate unique referral code for this user
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz';
      let refCode = '';
      for (let j = 0; j < 8; j++) {
        refCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      const refUser: User = {
        id: refUserId,
        username: 'refuser' + i,
        password: refHashedPassword,
        referralCode: refCode,
        referredBy: 'ADM1N0X7', // Referred by admin
        usdtBalance: '500.00',
  
        btcBalance: '0.00000000',
        hashPower: (20 + i * 5).toFixed(2), // 25, 30, 35 TH/s
        baseHashPower: (20 + i * 5).toFixed(2),
        referralHashBonus: '0.00',
        gbtcBalance: '0.00000000',
        unclaimedBalance: '0.00000000',
        totalReferralEarnings: '0.00',
        lastActiveBlock: 0,
        isAdmin: false,
        isFrozen: false,
        isBanned: false,
        createdAt: new Date()
      };
      
      this.users.set(refUserId, refUser);
      this.usersByUsername.set('refuser' + i, refUserId);
    }
    
    // Initialize system settings
    this.systemSettings.set('blockReward-1', {
      id: 'blockReward-1',
      key: 'blockReward',
      value: '50',
      updatedAt: new Date()
    });
    
    this.systemSettings.set('blockNumber-1', {
      id: 'blockNumber-1',
      key: 'blockNumber',
      value: '1',
      updatedAt: new Date()
    });
    
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const userId = this.usersByUsername.get(username);
    if (!userId) return undefined;
    return this.users.get(userId);
  }

  async getUserByAccessKey(accessKey: string): Promise<User | undefined> {
    // For memory storage, find user by hashed access key
    for (const user of this.users.values()) {
      if ((user as any).accessKey === accessKey) {
        return user;
      }
    }
    return undefined;
  }

  async getUsersByReferralCode(referralCode: string): Promise<User[]> {
    const referredUsers: User[] = [];
    for (const user of Array.from(this.users.values())) {
      if (user.referredBy === referralCode) {
        referredUsers.push(user);
      }
    }
    return referredUsers;
  }

  async findUserByOwnReferralCode(referralCode: string): Promise<User | null> {
    for (const user of Array.from(this.users.values())) {
      if (user.referralCode === referralCode) {
        return user;
      }
    }
    return null;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const userId = 'user-' + randomBytes(8).toString('hex');
    // Generate unique hash-style referral code (8 characters, alphanumeric)
    const generateReferralCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz';
      let code = '';
      // Generate a more hash-like code with mixed case
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      // Add timestamp component for uniqueness
      const timestamp = Date.now().toString(36).slice(-2).toUpperCase();
      return code.slice(0, 6) + timestamp;
    };
    
    // Ensure referral code is unique
    let referralCode = generateReferralCode();
    const existingCodes = Array.from(this.users.values()).map(u => u.referralCode).filter(Boolean);
    while (existingCodes.includes(referralCode)) {
      referralCode = generateReferralCode();
    }
    
    const user: User = {
      id: userId,
      username: insertUser.username,
      accessKey: (insertUser as any).accessKey || '',
      referralCode,
      referredBy: insertUser.referredBy || null,
      registrationIp: (insertUser as any).registrationIp || null,
      usdtBalance: '0.00',
      btcBalance: '0.00000000',
      hashPower: '0.00',
      baseHashPower: '0.00',
      referralHashBonus: '0.00',
      gbtcBalance: '0.00000000',
      unclaimedBalance: '0.00000000',
      totalReferralEarnings: '0.00',
      lastActiveBlock: null,
      isAdmin: false,
      isFrozen: false,
      isBanned: false,
      hasStartedMining: false,
      createdAt: new Date()
    };
    
    this.users.set(userId, user);
    this.usersByUsername.set(insertUser.username, userId);
    return user;
  }

  async hasIpRegistered(ip: string): Promise<boolean> {
    for (const user of this.users.values()) {
      if (user.registrationIp === ip) {
        return true;
      }
    }
    return false;
  }

  async updateUserBalance(userId: string, usdtBalance: string, hashPower: string, gbtcBalance: string, unclaimedBalance: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.usdtBalance = usdtBalance;
      user.hashPower = hashPower;
      user.gbtcBalance = gbtcBalance;
      user.unclaimedBalance = unclaimedBalance;
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      Object.assign(user, updates);
    }
  }

  async freezeUser(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.isFrozen = true;
    }
  }

  async unfreezeUser(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.isFrozen = false;
    }
  }

  async banUser(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.isBanned = true;
    }
  }

  async unbanUser(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.isBanned = false;
    }
  }

  async getGlobalDepositAddress(currency: 'USDT' | 'BTC'): Promise<string> {
    const key = `${currency}_DEPOSIT_ADDRESS`;
    const setting = this.systemSettings.get(key);
    if (currency === 'BTC') {
      return setting?.value || 'bc1qy8zzqsarhp0s63txsfnn3q3nvuu0g83mv3hwrv';
    }
    return setting?.value || 'TBGxYmP3tFrbKvJRvQcF9cENKixQeJdfQc';
  }

  async setGlobalDepositAddress(currency: 'USDT' | 'BTC', address: string): Promise<void> {
    const key = `${currency}_DEPOSIT_ADDRESS`;
    const settingId = `${key}-${randomBytes(8).toString('hex')}`;
    this.systemSettings.set(key, {
      id: settingId,
      key: key,
      value: address,
      updatedAt: new Date()
    });
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => 
      (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async updateUserBalances(userId: string, balances: { usdtBalance?: string; gbtcBalance?: string; hashPower?: string }): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      if (balances.usdtBalance !== undefined) user.usdtBalance = balances.usdtBalance;
      if (balances.gbtcBalance !== undefined) user.gbtcBalance = balances.gbtcBalance;
      if (balances.hashPower !== undefined) user.hashPower = balances.hashPower;
    }
  }

  async createDeposit(deposit: InsertDeposit & { userId: string }): Promise<Deposit> {
    // Check cooldown (12 hours = 43200000 ms)
    const lastRequest = this.lastDepositTime.get(deposit.userId);
    if (lastRequest) {
      const timePassed = Date.now() - lastRequest.getTime();
      const cooldownRemaining = 43200000 - timePassed; // 12 hours in ms
      if (cooldownRemaining > 0) {
        const hoursRemaining = Math.ceil(cooldownRemaining / (1000 * 60 * 60));
        throw new Error(`Please wait ${hoursRemaining} hours before making another deposit request`);
      }
    }
    
    const depositId = 'dep-' + randomBytes(8).toString('hex');
    const newDeposit: Deposit = {
      id: depositId,
      userId: deposit.userId,
      network: deposit.network,
      currency: deposit.network === 'BSC' ? 'USDT' : 'USDT',
      txHash: deposit.txHash,
      amount: deposit.amount,
      status: 'pending',
      adminNote: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.deposits.set(depositId, newDeposit);
    // Track the time of this deposit request
    this.lastDepositTime.set(deposit.userId, new Date());
    return newDeposit;
  }

  async getPendingDeposits(): Promise<(Deposit & { user: User })[]> {
    const pendingDeposits: (Deposit & { user: User })[] = [];
    
    for (const deposit of Array.from(this.deposits.values())) {
      if (deposit.status === 'pending') {
        const user = this.users.get(deposit.userId);
        if (user) {
          pendingDeposits.push({ ...deposit, user });
        }
      }
    }
    
    return pendingDeposits.sort((a, b) => 
      (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async approveDeposit(depositId: string, adminNote?: string, actualAmount?: string): Promise<void> {
    const deposit = this.deposits.get(depositId);
    if (!deposit) throw new Error("Deposit not found");
    
    // Use actualAmount if provided (admin verified amount), otherwise use original amount
    const amountToCredit = actualAmount || deposit.amount;
    
    deposit.status = 'approved';
    deposit.adminNote = adminNote || null;
    deposit.amount = amountToCredit; // Update with verified amount
    deposit.updatedAt = new Date();
    
    const user = this.users.get(deposit.userId);
    if (user) {
      // Check deposit currency
      if (deposit.currency === 'BTC') {
        const newBalance = (parseFloat(user.btcBalance || "0") + parseFloat(amountToCredit)).toFixed(8);
        user.btcBalance = newBalance;
      } else {
        const newBalance = (parseFloat(user.usdtBalance || "0") + parseFloat(amountToCredit)).toFixed(2);
        user.usdtBalance = newBalance;
      }
    }
  }

  async rejectDeposit(depositId: string, adminNote?: string): Promise<void> {
    const deposit = this.deposits.get(depositId);
    if (deposit) {
      deposit.status = 'rejected';
      deposit.adminNote = adminNote || null;
      deposit.updatedAt = new Date();
    }
  }

  async createWithdrawal(withdrawal: InsertWithdrawal & { userId: string }): Promise<Withdrawal> {
    // Check cooldown (12 hours = 43200000 ms)
    const lastRequest = this.lastWithdrawalTime.get(withdrawal.userId);
    if (lastRequest) {
      const timePassed = Date.now() - lastRequest.getTime();
      const cooldownRemaining = 43200000 - timePassed; // 12 hours in ms
      if (cooldownRemaining > 0) {
        const hoursRemaining = Math.ceil(cooldownRemaining / (1000 * 60 * 60));
        throw new Error(`Please wait ${hoursRemaining} hours before making another withdrawal request`);
      }
    }
    
    const withdrawalId = 'with-' + randomBytes(8).toString('hex');
    const newWithdrawal: Withdrawal = {
      id: withdrawalId,
      userId: withdrawal.userId,
      amount: withdrawal.amount,
      address: withdrawal.address,
      network: withdrawal.network,
      currency: withdrawal.network === 'GBTC' ? 'GBTC' : 'USDT',
      status: 'pending',
      txHash: null,
      createdAt: new Date()
    };
    
    this.withdrawals.set(withdrawalId, newWithdrawal);
    // Track the time of this withdrawal request
    this.lastWithdrawalTime.set(withdrawal.userId, new Date());
    return newWithdrawal;
  }

  async getPendingWithdrawals(): Promise<any[]> {
    const pendingWithdrawals = Array.from(this.withdrawals.values())
      .filter(w => w.status === 'pending')
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    
    // Add user information
    return pendingWithdrawals.map(withdrawal => {
      const user = this.users.get(withdrawal.userId);
      return {
        ...withdrawal,
        user: user ? {
          id: user.id,
          username: user.username,
          usdtBalance: user.usdtBalance,
          gbtcBalance: user.gbtcBalance,
          btcBalance: user.btcBalance
        } : null
      };
    });
  }

  async approveWithdrawal(withdrawalId: string, txHash?: string): Promise<void> {
    const withdrawal = this.withdrawals.get(withdrawalId);
    if (!withdrawal) {
      throw new Error('Withdrawal not found');
    }

    const user = this.users.get(withdrawal.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const amount = parseFloat(withdrawal.amount);
    const isUSDT = withdrawal.network === 'ERC20' || withdrawal.network === 'BSC' || withdrawal.network === 'TRC20';
    const isBTC = withdrawal.network === 'BTC';

    // Check balance and deduct
    if (isBTC) {
      const btcBalance = parseFloat(user.btcBalance || "0");
      if (btcBalance < amount) {
        throw new Error('Insufficient BTC balance');
      }
      user.btcBalance = (btcBalance - amount).toFixed(8);
    } else if (isUSDT) {
      const usdtBalance = parseFloat(user.usdtBalance || "0");
      if (usdtBalance < amount) {
        throw new Error('Insufficient USDT balance');
      }
      user.usdtBalance = (usdtBalance - amount).toFixed(2);
    } else {
      const gbtcBalance = parseFloat(user.gbtcBalance || "0");
      if (gbtcBalance < amount) {
        throw new Error('Insufficient GBTC balance');
      }
      user.gbtcBalance = (gbtcBalance - amount).toFixed(8);
    }

    // Update withdrawal status
    withdrawal.status = 'completed';
    if (txHash) {
      withdrawal.txHash = txHash;
    }
  }

  async rejectWithdrawal(withdrawalId: string): Promise<void> {
    const withdrawal = this.withdrawals.get(withdrawalId);
    if (!withdrawal) {
      throw new Error('Withdrawal not found');
    }
    withdrawal.status = 'rejected';
  }

  async createMiningBlock(blockNumber: number, reward: string, totalHashPower: string): Promise<MiningBlock> {
    const blockId = 'block-' + randomBytes(8).toString('hex');
    const block: MiningBlock = {
      id: blockId,
      blockNumber,
      reward,
      totalHashPower,
      timestamp: new Date()
    };
    
    this.miningBlocks.set(blockId, block);
    return block;
  }

  async getLatestBlock(): Promise<MiningBlock | undefined> {
    let latestBlock: MiningBlock | undefined;
    let maxBlockNumber = -1;
    
    for (const block of Array.from(this.miningBlocks.values())) {
      if (block.blockNumber > maxBlockNumber) {
        maxBlockNumber = block.blockNumber;
        latestBlock = block;
      }
    }
    
    return latestBlock;
  }

  async getTotalHashPower(): Promise<string> {
    let total = 0;
    for (const user of Array.from(this.users.values())) {
      total += parseFloat(user.hashPower || "0");
    }
    return total.toFixed(2);
  }

  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    for (const setting of Array.from(this.systemSettings.values())) {
      if (setting.key === key) {
        return setting;
      }
    }
    return undefined;
  }

  async setSystemSetting(key: string, value: string): Promise<void> {
    const existingSetting = await this.getSystemSetting(key);
    if (existingSetting) {
      existingSetting.value = value;
      existingSetting.updatedAt = new Date();
    } else {
      const settingId = key + '-' + randomBytes(4).toString('hex');
      this.systemSettings.set(settingId, {
        id: settingId,
        key,
        value,
        updatedAt: new Date()
      });
    }
  }

  async getUserCount(): Promise<number> {
    return this.users.size;
  }

  async getTotalDeposits(): Promise<string> {
    let total = 0;
    for (const deposit of Array.from(this.deposits.values())) {
      if (deposit.status === 'approved') {
        total += parseFloat(deposit.amount);
      }
    }
    return total.toFixed(2);
  }

  async getTotalWithdrawals(): Promise<string> {
    let total = 0;
    for (const withdrawal of Array.from(this.withdrawals.values())) {
      if (withdrawal.status === 'completed') {
        total += parseFloat(withdrawal.amount);
      }
    }
    return total.toFixed(2);
  }

  async getActiveMinerCount(): Promise<number> {
    let count = 0;
    for (const activity of Array.from(this.minerActivity.values())) {
      if (activity.isActive) {
        count++;
      }
    }
    return count;
  }

  async createUnclaimedBlock(userId: string, blockNumber: number, txHash: string, reward: string): Promise<UnclaimedBlock> {
    const blockId = 'unclaimed-' + randomBytes(8).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    const block: UnclaimedBlock = {
      id: blockId,
      userId,
      blockNumber,
      txHash,
      reward,
      expiresAt,
      claimed: false,
      claimedAt: null,
      createdAt: new Date()
    };
    
    this.unclaimedBlocks.set(blockId, block);
    return block;
  }

  async getUnclaimedBlocks(userId: string): Promise<UnclaimedBlock[]> {
    const blocks: UnclaimedBlock[] = [];
    const now = new Date();
    
    for (const block of Array.from(this.unclaimedBlocks.values())) {
      if (block.userId === userId && !block.claimed && block.expiresAt > now) {
        blocks.push(block);
      }
    }
    
    return blocks.sort((a, b) => 
      (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async claimBlock(blockId: string, userId: string): Promise<{ success: boolean; reward?: string }> {
    const block = this.unclaimedBlocks.get(blockId);
    const now = new Date();
    
    if (!block || block.userId !== userId || block.claimed || block.expiresAt <= now) {
      return { success: false };
    }
    
    block.claimed = true;
    block.claimedAt = now;
    
    const user = this.users.get(userId);
    if (user) {
      const newBalance = (parseFloat(user.gbtcBalance || "0") + parseFloat(block.reward)).toFixed(8);
      user.gbtcBalance = newBalance;
    }
    
    await this.updateMinerActivity(userId, true);
    
    return { success: true, reward: block.reward };
  }

  async claimAllBlocks(userId: string): Promise<{ count: number; totalReward: string }> {
    const blocks = await this.getUnclaimedBlocks(userId);
    
    if (blocks.length === 0) {
      return { count: 0, totalReward: '0' };
    }
    
    let totalReward = 0;
    const now = new Date();
    
    for (const block of blocks) {
      block.claimed = true;
      block.claimedAt = now;
      totalReward += parseFloat(block.reward);
    }
    
    const user = this.users.get(userId);
    if (user) {
      const newBalance = (parseFloat(user.gbtcBalance || "0") + totalReward).toFixed(8);
      user.gbtcBalance = newBalance;
    }
    
    await this.updateMinerActivity(userId, true);
    
    return { 
      count: blocks.length, 
      totalReward: totalReward.toFixed(8) 
    };
  }

  async expireOldBlocks(): Promise<void> {
    const now = new Date();
    
    for (const block of Array.from(this.unclaimedBlocks.values())) {
      if (!block.claimed && block.expiresAt <= now) {
        await this.updateMinerActivity(block.userId, false);
      }
    }
  }

  async createTransfer(fromUserId: string, toUsername: string, amount: string): Promise<Transfer> {
    const toUserId = this.usersByUsername.get(toUsername);
    if (!toUserId) {
      throw new Error('Recipient not found');
    }
    
    const fromUser = this.users.get(fromUserId);
    const toUser = this.users.get(toUserId);
    
    if (!fromUser) {
      throw new Error('Sender not found');
    }
    
    if (!toUser) {
      throw new Error('Recipient not found');
    }
    
    const senderBalance = parseFloat(fromUser.gbtcBalance || "0");
    if (senderBalance < parseFloat(amount)) {
      throw new Error('Insufficient balance');
    }
    
    fromUser.gbtcBalance = (senderBalance - parseFloat(amount)).toFixed(8);
    toUser.gbtcBalance = (parseFloat(toUser.gbtcBalance || "0") + parseFloat(amount)).toFixed(8);
    
    const transferId = 'transfer-' + randomBytes(8).toString('hex');
    const txHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    
    const transfer: Transfer = {
      id: transferId,
      fromUserId,
      toUserId,
      amount,
      txHash,
      createdAt: new Date()
    };
    
    this.transfers.set(transferId, transfer);
    return transfer;
  }

  async getMinersStatus(): Promise<(MinerActivity & { user: User })[]> {
    const result: (MinerActivity & { user: User })[] = [];
    
    for (const activity of Array.from(this.minerActivity.values())) {
      const user = this.users.get(activity.userId);
      if (user) {
        result.push({ ...activity, user });
      }
    }
    
    return result;
  }

  async updateMinerActivity(userId: string, claimed: boolean): Promise<void> {
    const activity = this.minerActivity.get(userId);
    const now = new Date();
    
    if (!activity) {
      const newActivity: MinerActivity = {
        id: 'activity-' + randomBytes(8).toString('hex'),
        userId,
        lastClaimTime: claimed ? now : null,
        totalClaims: claimed ? 1 : 0,
        missedClaims: claimed ? 0 : 1,
        isActive: claimed,
        updatedAt: now
      };
      this.minerActivity.set(userId, newActivity);
    } else {
      const lastClaim = activity.lastClaimTime;
      const hoursSinceLastClaim = lastClaim ? (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60) : 999;
      
      activity.lastClaimTime = claimed ? now : activity.lastClaimTime;
      activity.totalClaims = claimed ? (activity.totalClaims || 0) + 1 : (activity.totalClaims || 0);
      activity.missedClaims = claimed ? (activity.missedClaims || 0) : (activity.missedClaims || 0) + 1;
      activity.isActive = hoursSinceLastClaim < 48;
      activity.updatedAt = now;
    }
  }

  async getUserDeposits(userId: string): Promise<Deposit[]> {
    const userDeposits: Deposit[] = [];
    
    for (const deposit of Array.from(this.deposits.values())) {
      if (deposit.userId === userId) {
        userDeposits.push(deposit);
      }
    }
    
    return userDeposits.sort((a, b) => 
      (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async getUserWithdrawals(userId: string): Promise<Withdrawal[]> {
    const userWithdrawals: Withdrawal[] = [];
    
    for (const withdrawal of Array.from(this.withdrawals.values())) {
      if (withdrawal.userId === userId) {
        userWithdrawals.push(withdrawal);
      }
    }
    
    return userWithdrawals.sort((a, b) => 
      (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async getSentTransfers(userId: string): Promise<Transfer[]> {
    const sentTransfers: Transfer[] = [];
    
    for (const transfer of Array.from(this.transfers.values())) {
      if (transfer.fromUserId === userId) {
        const toUser = this.users.get(transfer.toUserId);
        sentTransfers.push({
          ...transfer,
          toUsername: toUser?.username || 'Unknown'
        } as any);
      }
    }
    
    return sentTransfers.sort((a, b) => 
      (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async getReceivedTransfers(userId: string): Promise<Transfer[]> {
    const receivedTransfers: Transfer[] = [];
    
    for (const transfer of Array.from(this.transfers.values())) {
      if (transfer.toUserId === userId) {
        const fromUser = this.users.get(transfer.fromUserId);
        receivedTransfers.push({
          ...transfer,
          fromUsername: fromUser?.username || 'Unknown'
        } as any);
      }
    }
    
    return receivedTransfers.sort((a, b) => 
      (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async getDepositCooldown(userId: string): Promise<{ canDeposit: boolean; hoursRemaining: number }> {
    const lastRequest = this.lastDepositTime.get(userId);
    if (!lastRequest) {
      return { canDeposit: true, hoursRemaining: 0 };
    }
    
    const timePassed = Date.now() - lastRequest.getTime();
    const cooldownRemaining = 43200000 - timePassed; // 12 hours in ms
    
    if (cooldownRemaining > 0) {
      // Return precise hours remaining (with decimal) for accurate countdown
      const hoursRemaining = cooldownRemaining / (1000 * 60 * 60);
      return { canDeposit: false, hoursRemaining };
    }
    
    return { canDeposit: true, hoursRemaining: 0 };
  }

  async getWithdrawalCooldown(userId: string): Promise<{ canWithdraw: boolean; hoursRemaining: number }> {
    const lastRequest = this.lastWithdrawalTime.get(userId);
    if (!lastRequest) {
      return { canWithdraw: true, hoursRemaining: 0 };
    }
    
    const timePassed = Date.now() - lastRequest.getTime();
    const cooldownRemaining = 43200000 - timePassed; // 12 hours in ms
    
    if (cooldownRemaining > 0) {
      // Return precise hours remaining (with decimal) for accurate countdown
      const hoursRemaining = cooldownRemaining / (1000 * 60 * 60);
      return { canWithdraw: false, hoursRemaining };
    }
    
    return { canWithdraw: true, hoursRemaining: 0 };
  }
  
  // Supply tracking methods implementation
  async getTotalMinedSupply(): Promise<string> {
    // Calculate total mined supply from all mining blocks
    let totalMined = 0;
    for (const block of Array.from(this.miningBlocks.values())) {
      totalMined += parseFloat(block.reward || "0");
    }
    return totalMined.toFixed(8);
  }
  
  async getCirculatingSupply(): Promise<string> {
    // Circulating supply = All GBTC in user wallets (not unclaimed)
    let circulatingSupply = 0;
    for (const user of Array.from(this.users.values())) {
      circulatingSupply += parseFloat(user.gbtcBalance || "0");
    }
    return circulatingSupply.toFixed(8);
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
    const MAX_SUPPLY = 2100000; // 2.1M GBTC max supply
    const HALVING_INTERVAL = 4200; // Blocks between halvings
    
    // Get total mined supply
    const totalMined = await this.getTotalMinedSupply();
    
    // Get circulating supply
    const circulating = await this.getCirculatingSupply();
    
    // Get current block reward
    const blockRewardSetting = this.systemSettings.get("blockReward");
    const currentBlockReward = blockRewardSetting ? blockRewardSetting.value : "50";
    
    // Get total blocks mined
    const totalBlockHeightSetting = this.systemSettings.get("totalBlockHeight");
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
  }
  
  // Track BTC/USDT conversions
  async createBtcConversion(userId: string, fromCurrency: string, toCurrency: string, fromAmount: string, toAmount: string, fee: string, rate: string): Promise<any> {
    const conversionId = 'btc-conv-' + randomBytes(8).toString('hex');
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
  private btcStakes: Map<string, any> = new Map();
  private btcStakingRewards: Map<string, any[]> = new Map();
  private btcPriceHistory: any[] = [];

  async createBtcStake(userId: string, btcAmount: string, gbtcHashrate: string, btcPrice: string, months: number = 12, apr: number = 20): Promise<any> {
    const stakeId = 'stake-' + randomBytes(8).toString('hex');
    const dailyReward = (parseFloat(btcAmount) * apr / 100 / 365).toFixed(8); // Dynamic APR daily
    const unlockAt = new Date();
    unlockAt.setMonth(unlockAt.getMonth() + months); // Dynamic lock period

    const stake = {
      id: stakeId,
      userId,
      btcAmount,
      gbtcHashrate,
      btcPriceAtStake: btcPrice,
      aprRate: apr.toFixed(2),
      dailyReward,
      totalRewardsPaid: '0.00000000',
      stakedAt: new Date(),
      unlockAt,
      status: 'active',
      lastRewardAt: null,
      lockMonths: months
    };

    this.btcStakes.set(stakeId, stake);
    return stake;
  }

  async getUserBtcStakes(userId: string): Promise<any[]> {
    const stakes: any[] = [];
    for (const stake of Array.from(this.btcStakes.values())) {
      if (stake.userId === userId) {
        stakes.push(stake);
      }
    }
    return stakes.sort((a, b) => b.stakedAt.getTime() - a.stakedAt.getTime());
  }

  async getActiveBtcStakes(): Promise<any[]> {
    const stakes: any[] = [];
    for (const stake of Array.from(this.btcStakes.values())) {
      if (stake.status === 'active') {
        stakes.push(stake);
      }
    }
    return stakes;
  }

  async processDailyBtcRewards(): Promise<void> {
    const activeStakes = await this.getActiveBtcStakes();
    const currentBtcPrice = await this.getCurrentBtcPrice();

    for (const stake of activeStakes) {
      // Record reward payment
      const rewardId = 'reward-' + randomBytes(8).toString('hex');
      const reward = {
        id: rewardId,
        stakeId: stake.id,
        userId: stake.userId,
        rewardAmount: stake.dailyReward,
        btcPrice: currentBtcPrice,
        paidAt: new Date()
      };

      if (!this.btcStakingRewards.has(stake.userId)) {
        this.btcStakingRewards.set(stake.userId, []);
      }
      this.btcStakingRewards.get(stake.userId)!.push(reward);

      // Update user BTC balance
      const user = this.users.get(stake.userId);
      if (user) {
        const currentBalance = parseFloat((user as any).btcBalance || '0');
        (user as any).btcBalance = (currentBalance + parseFloat(stake.dailyReward)).toFixed(8);
      }

      // Update stake's total rewards paid
      stake.totalRewardsPaid = (parseFloat(stake.totalRewardsPaid) + parseFloat(stake.dailyReward)).toFixed(8);
      stake.lastRewardAt = new Date();
    }
  }

  async getCurrentBtcPrice(): Promise<string> {
    // Check if we have a cached price that's still fresh
    const now = Date.now();
    if (this.btcPriceCache && (now - this.btcPriceCache.timestamp) < this.PRICE_CACHE_DURATION) {
      return this.btcPriceCache.price;
    }

    // Fetch fresh price from public API
    try {
      // Using CoinGecko public API (no key required)
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      if (response.ok) {
        const data = await response.json();
        const price = data.bitcoin?.usd || 111000;
        const priceStr = price.toFixed(2);
        
        // Cache the price
        this.btcPriceCache = {
          price: priceStr,
          timestamp: now
        };
        
        // Price fetched successfully
        return priceStr;
      }
    } catch (error) {
      // Failed to fetch price, using fallback
    }
    
    // Fallback to a default if API fails
    return "111000.00";
  }

  async updateBtcPrice(price: string, source: string = 'system'): Promise<void> {
    this.btcPriceHistory.push({
      price,
      source,
      timestamp: new Date()
    });
  }

  async getSystemHashratePrice(): Promise<string> {
    // Fixed pricing model: 1 GH/s = 1 USD
    // This means if BTC = $111,000, you need 111,000 GH/s to stake 1 BTC
    return "1.00";
  }

  async getUserBtcBalance(userId: string): Promise<string> {
    const user = this.users.get(userId);
    return (user as any)?.btcBalance || '0.00000000';
  }

  async updateUserBtcBalance(userId: string, btcBalance: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      (user as any).btcBalance = btcBalance;
    }
  }

  // Device Fingerprinting methods
  async upsertDevice(deviceData: { 
    serverDeviceId: string; 
    lastIp?: string; 
    asn?: string; 
    fingerprints: InsertDeviceFingerprint 
  }): Promise<{ device: Device; canRegister: boolean }> {
    const { serverDeviceId, lastIp, asn, fingerprints } = deviceData;
    
    // Check if device already exists by serverDeviceId
    let deviceId = this.devicesByServerDeviceId.get(serverDeviceId);
    let device: Device;

    if (!deviceId) {
      // Check for matching fingerprints first
      const matchingDevice = await this.findMatchingDevice(fingerprints);
      
      if (matchingDevice) {
        // Update existing device with new serverDeviceId
        device = { 
          ...matchingDevice, 
          serverDeviceId, 
          lastSeen: new Date(),
          lastIp: lastIp || null,
          asn: asn || null
        };
        this.devices.set(matchingDevice.id, device);
        this.devicesByServerDeviceId.set(serverDeviceId, matchingDevice.id);
      } else {
        // Create new device
        deviceId = 'device-' + randomBytes(8).toString('hex');
        device = {
          id: deviceId,
          serverDeviceId,
          firstSeen: new Date(),
          lastSeen: new Date(),
          lastIp: lastIp || null,
          asn: asn || null,
          registrations: 0,
          riskScore: 0,
          blocked: false,
          signalsVersion: '1.0'
        };
        this.devices.set(deviceId, device);
        this.devicesByServerDeviceId.set(serverDeviceId, deviceId);
      }

      // Add fingerprints
      const fingerprint: DeviceFingerprint = {
        id: 'fp-' + randomBytes(8).toString('hex'),
        deviceId,
        ...fingerprints,
        createdAt: new Date()
      };
      
      const existingFingerprints = this.deviceFingerprints.get(deviceId) || [];
      this.deviceFingerprints.set(deviceId, [...existingFingerprints, fingerprint]);
    } else {
      // Update existing device
      device = this.devices.get(deviceId)!;
      device = { 
        ...device, 
        lastSeen: new Date(),
        lastIp: lastIp || null,
        asn: asn || null
      };
      this.devices.set(deviceId, device);
    }

    const canRegister = !device.blocked && device.registrations === 0;
    return { device, canRegister };
  }

  async findMatchingDevice(fingerprints: Omit<InsertDeviceFingerprint, 'deviceId'>): Promise<Device | null> {
    // Check for exact stable hash match (highest confidence)
    if (fingerprints.stableHash) {
      for (const [deviceId, fpList] of this.deviceFingerprints.entries()) {
        for (const fp of fpList) {
          if (fp.stableHash === fingerprints.stableHash) {
            return this.devices.get(deviceId) || null;
          }
        }
      }
    }

    // Check for WebGL + Fonts combination (high confidence)
    if (fingerprints.webglHash && fingerprints.fontsHash) {
      for (const [deviceId, fpList] of this.deviceFingerprints.entries()) {
        for (const fp of fpList) {
          if (fp.webglHash === fingerprints.webglHash && fp.fontsHash === fingerprints.fontsHash) {
            return this.devices.get(deviceId) || null;
          }
        }
      }
    }

    return null;
  }

  async linkUserToDevice(userId: string, deviceId: string): Promise<void> {
    // Check if link already exists
    const userDevicesList = this.userDevices.get(userId) || [];
    
    if (!userDevicesList.includes(deviceId)) {
      userDevicesList.push(deviceId);
      this.userDevices.set(userId, userDevicesList);
    }

    // Increment device registration count
    const device = this.devices.get(deviceId);
    if (device) {
      device.registrations += 1;
      this.devices.set(deviceId, device);
    }
  }

  async blockDevice(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId);
    if (device) {
      device.blocked = true;
      this.devices.set(deviceId, device);
    }
  }

  async allowlistDevice(deviceId: string, maxRegistrations: number = 2): Promise<void> {
    const device = this.devices.get(deviceId);
    if (device) {
      device.blocked = false;
      device.registrations = 0; // Reset registrations for allowlisted device
      this.devices.set(deviceId, device);
    }
  }
}