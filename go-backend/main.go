package main

import (
        "context"
        "crypto/rand"
        "encoding/base64"
        "encoding/json"
        "fmt"
        "log"
        "net/http"
        "os"
        "strings"
        "time"

        "github.com/go-chi/chi/v5"
        "github.com/go-chi/cors"
        "github.com/gorilla/sessions"
        "github.com/jackc/pgx/v4"
        "github.com/jackc/pgx/v4/pgxpool"
        "github.com/shopspring/decimal"
        "golang.org/x/crypto/scrypt"
)

var (
        db    *pgxpool.Pool
        store *sessions.CookieStore
)

// User represents the users table
type User struct {
        ID                    string          `json:"id" db:"id"`
        Username              string          `json:"username" db:"username"`
        AccessKey             string          `json:"accessKey" db:"access_key"`
        ReferralCode          *string         `json:"referralCode" db:"referral_code"`
        ReferredBy            *string         `json:"referredBy" db:"referred_by"`
        RegistrationIP        *string         `json:"registrationIp" db:"registration_ip"`
        USDTBalance           decimal.Decimal `json:"usdtBalance" db:"usdt_balance"`
        BTCBalance            decimal.Decimal `json:"btcBalance" db:"btc_balance"`
        HashPower             decimal.Decimal `json:"hashPower" db:"hash_power"`
        BaseHashPower         decimal.Decimal `json:"baseHashPower" db:"base_hash_power"`
        ReferralHashBonus     decimal.Decimal `json:"referralHashBonus" db:"referral_hash_bonus"`
        GBTCBalance           decimal.Decimal `json:"gbtcBalance" db:"gbtc_balance"`
        UnclaimedBalance      decimal.Decimal `json:"unclaimedBalance" db:"unclaimed_balance"`
        TotalReferralEarnings decimal.Decimal `json:"totalReferralEarnings" db:"total_referral_earnings"`
        LastActiveBlock       *int            `json:"lastActiveBlock" db:"last_active_block"`
        IsAdmin               bool            `json:"isAdmin" db:"is_admin"`
        IsFrozen              bool            `json:"isFrozen" db:"is_frozen"`
        IsBanned              bool            `json:"isBanned" db:"is_banned"`
        HasStartedMining      bool            `json:"hasStartedMining" db:"has_started_mining"`
        KYCVerified           bool            `json:"kycVerified" db:"kyc_verified"`
        KYCVerificationHash   *string         `json:"kycVerificationHash" db:"kyc_verification_hash"`
        CreatedAt             time.Time       `json:"createdAt" db:"created_at"`
}

// Deposit represents the deposits table
type Deposit struct {
        ID        string          `json:"id" db:"id"`
        UserID    string          `json:"userId" db:"user_id"`
        Network   string          `json:"network" db:"network"`
        TxHash    string          `json:"txHash" db:"tx_hash"`
        Amount    decimal.Decimal `json:"amount" db:"amount"`
        Currency  string          `json:"currency" db:"currency"`
        Status    string          `json:"status" db:"status"`
        AdminNote *string         `json:"adminNote" db:"admin_note"`
        CreatedAt time.Time       `json:"createdAt" db:"created_at"`
        UpdatedAt time.Time       `json:"updatedAt" db:"updated_at"`
}

// DeviceFingerprint represents device security data
type DeviceFingerprint struct {
        ID                 string    `json:"id" db:"id"`
        ServerDeviceID     string    `json:"serverDeviceId" db:"server_device_id"`
        LastIP             *string   `json:"lastIp" db:"last_ip"`
        Registrations      int       `json:"registrations" db:"registrations"`
        MaxRegistrations   int       `json:"maxRegistrations" db:"max_registrations"`
        Blocked            bool      `json:"blocked" db:"blocked"`
        RiskScore          int       `json:"riskScore" db:"risk_score"`
        UserAgent          string    `json:"userAgent" db:"user_agent"`
        ScreenResolution   string    `json:"screenResolution" db:"screen_resolution"`
        Timezone           string    `json:"timezone" db:"timezone"`
        Language           string    `json:"language" db:"language"`
        CanvasFingerprint  string    `json:"canvasFingerprint" db:"canvas_fingerprint"`
        WebGLFingerprint   string    `json:"webglFingerprint" db:"webgl_fingerprint"`
        AudioFingerprint   string    `json:"audioFingerprint" db:"audio_fingerprint"`
        CreatedAt          time.Time `json:"createdAt" db:"created_at"`
        UpdatedAt          time.Time `json:"updatedAt" db:"updated_at"`
}

// Request/Response structs
type LoginRequest struct {
        Username  string `json:"username" validate:"required"`
        AccessKey string `json:"accessKey" validate:"required"`
}

type RegisterRequest struct {
        Username     string  `json:"username" validate:"required,min=3,max=20"`
        AccessKey    string  `json:"accessKey" validate:"required,min=6"`
        ReferralCode *string `json:"referralCode,omitempty"`
}

type DeviceCheckRequest struct {
        ServerDeviceID       string `json:"serverDeviceId" validate:"required"`
        UserAgent            string `json:"userAgent" validate:"required"`
        ScreenResolution     string `json:"screenResolution" validate:"required"`
        Timezone             string `json:"timezone" validate:"required"`
        Language             string `json:"language" validate:"required"`
        CanvasFingerprint    string `json:"canvasFingerprint" validate:"required"`
        WebGLFingerprint     string `json:"webglFingerprint" validate:"required"`
        AudioFingerprint     string `json:"audioFingerprint" validate:"required"`
}

type DeviceCheckResponse struct {
        DeviceID      string `json:"deviceId"`
        CanRegister   bool   `json:"canRegister"`
        Registrations int    `json:"registrations"`
        Blocked       bool   `json:"blocked"`
        RiskScore     int    `json:"riskScore"`
}

type ErrorResponse struct {
        Message string `json:"message"`
}

// Database operations

// getUserByID retrieves a user by ID
func getUserByID(ctx context.Context, userID string) (*User, error) {
        query := `
                SELECT id, username, access_key, referral_code, referred_by, registration_ip,
                       usdt_balance, btc_balance, hash_power, base_hash_power, referral_hash_bonus,
                       gbtc_balance, unclaimed_balance, total_referral_earnings, last_active_block,
                       is_admin, is_frozen, is_banned, has_started_mining, kyc_verified,
                       kyc_verification_hash, created_at
                FROM users WHERE id = $1
        `
        
        var user User
        var usdtStr, btcStr, hashStr, baseHashStr, refHashStr, gbtcStr, unclaimedStr, refEarningsStr string
        err := db.QueryRow(ctx, query, userID).Scan(
                &user.ID, &user.Username, &user.AccessKey, &user.ReferralCode, &user.ReferredBy,
                &user.RegistrationIP, &usdtStr, &btcStr, &hashStr,
                &baseHashStr, &refHashStr, &gbtcStr, &unclaimedStr,
                &refEarningsStr, &user.LastActiveBlock, &user.IsAdmin, &user.IsFrozen,
                &user.IsBanned, &user.HasStartedMining, &user.KYCVerified, &user.KYCVerificationHash,
                &user.CreatedAt,
        )
        
        if err == nil {
                user.USDTBalance, _ = decimal.NewFromString(usdtStr)
                user.BTCBalance, _ = decimal.NewFromString(btcStr)
                user.HashPower, _ = decimal.NewFromString(hashStr)
                user.BaseHashPower, _ = decimal.NewFromString(baseHashStr)
                user.ReferralHashBonus, _ = decimal.NewFromString(refHashStr)
                user.GBTCBalance, _ = decimal.NewFromString(gbtcStr)
                user.UnclaimedBalance, _ = decimal.NewFromString(unclaimedStr)
                user.TotalReferralEarnings, _ = decimal.NewFromString(refEarningsStr)
        }
        
        if err != nil {
                if err == pgx.ErrNoRows {
                        return nil, nil
                }
                return nil, fmt.Errorf("failed to get user by ID: %w", err)
        }
        
        return &user, nil
}

// getUserByUsername retrieves a user by username
func getUserByUsername(ctx context.Context, username string) (*User, error) {
        query := `
                SELECT id, username, access_key, referral_code, referred_by, registration_ip,
                       usdt_balance, btc_balance, hash_power, base_hash_power, referral_hash_bonus,
                       gbtc_balance, unclaimed_balance, total_referral_earnings, last_active_block,
                       is_admin, is_frozen, is_banned, has_started_mining, kyc_verified,
                       kyc_verification_hash, created_at
                FROM users WHERE username = $1
        `
        
        var user User
        var usdtStr, btcStr, hashStr, baseHashStr, refHashStr, gbtcStr, unclaimedStr, refEarningsStr string
        err := db.QueryRow(ctx, query, username).Scan(
                &user.ID, &user.Username, &user.AccessKey, &user.ReferralCode, &user.ReferredBy,
                &user.RegistrationIP, &usdtStr, &btcStr, &hashStr,
                &baseHashStr, &refHashStr, &gbtcStr, &unclaimedStr,
                &refEarningsStr, &user.LastActiveBlock, &user.IsAdmin, &user.IsFrozen,
                &user.IsBanned, &user.HasStartedMining, &user.KYCVerified, &user.KYCVerificationHash,
                &user.CreatedAt,
        )
        
        if err == nil {
                user.USDTBalance, _ = decimal.NewFromString(usdtStr)
                user.BTCBalance, _ = decimal.NewFromString(btcStr)
                user.HashPower, _ = decimal.NewFromString(hashStr)
                user.BaseHashPower, _ = decimal.NewFromString(baseHashStr)
                user.ReferralHashBonus, _ = decimal.NewFromString(refHashStr)
                user.GBTCBalance, _ = decimal.NewFromString(gbtcStr)
                user.UnclaimedBalance, _ = decimal.NewFromString(unclaimedStr)
                user.TotalReferralEarnings, _ = decimal.NewFromString(refEarningsStr)
        }
        
        if err != nil {
                if err == pgx.ErrNoRows {
                        return nil, nil
                }
                return nil, fmt.Errorf("failed to get user: %w", err)
        }
        
        return &user, nil
}

// createUser creates a new user account
func createUser(ctx context.Context, req RegisterRequest, clientIP string) (*User, error) {
        // Hash the access key using scrypt
        salt := make([]byte, 32)
        if _, err := rand.Read(salt); err != nil {
                return nil, fmt.Errorf("failed to generate salt: %w", err)
        }
        
        hash, err := scrypt.Key([]byte(req.AccessKey), salt, 32768, 8, 1, 32)
        if err != nil {
                return nil, fmt.Errorf("failed to hash access key: %w", err)
        }
        
        hashedKey := base64.StdEncoding.EncodeToString(hash) + ":" + base64.StdEncoding.EncodeToString(salt)
        
        // Generate referral code from username
        referralCode := generateReferralCode(req.Username)
        
        query := `
                INSERT INTO users (username, access_key, referral_code, referred_by, registration_ip,
                                  usdt_balance, btc_balance, hash_power, base_hash_power, referral_hash_bonus,
                                  gbtc_balance, unclaimed_balance, total_referral_earnings)
                VALUES ($1, $2, $3, $4, $5, 0.00, 0.00000000, 0.00, 0.00, 0.00, 0.00000000, 0.00000000, 0.00)
                RETURNING id, username, access_key, referral_code, referred_by, registration_ip,
                          usdt_balance, btc_balance, hash_power, base_hash_power, referral_hash_bonus,
                          gbtc_balance, unclaimed_balance, total_referral_earnings, last_active_block,
                          is_admin, is_frozen, is_banned, has_started_mining, kyc_verified,
                          kyc_verification_hash, created_at
        `
        
        var user User
        var usdtStr, btcStr, hashStr, baseHashStr, refHashStr, gbtcStr, unclaimedStr, refEarningsStr string
        err = db.QueryRow(ctx, query, req.Username, hashedKey, referralCode, req.ReferralCode, clientIP).Scan(
                &user.ID, &user.Username, &user.AccessKey, &user.ReferralCode, &user.ReferredBy,
                &user.RegistrationIP, &usdtStr, &btcStr, &hashStr,
                &baseHashStr, &refHashStr, &gbtcStr, &unclaimedStr,
                &refEarningsStr, &user.LastActiveBlock, &user.IsAdmin, &user.IsFrozen,
                &user.IsBanned, &user.HasStartedMining, &user.KYCVerified, &user.KYCVerificationHash,
                &user.CreatedAt,
        )
        
        if err == nil {
                user.USDTBalance, _ = decimal.NewFromString(usdtStr)
                user.BTCBalance, _ = decimal.NewFromString(btcStr)
                user.HashPower, _ = decimal.NewFromString(hashStr)
                user.BaseHashPower, _ = decimal.NewFromString(baseHashStr)
                user.ReferralHashBonus, _ = decimal.NewFromString(refHashStr)
                user.GBTCBalance, _ = decimal.NewFromString(gbtcStr)
                user.UnclaimedBalance, _ = decimal.NewFromString(unclaimedStr)
                user.TotalReferralEarnings, _ = decimal.NewFromString(refEarningsStr)
        }
        
        if err != nil {
                return nil, fmt.Errorf("failed to create user: %w", err)
        }
        
        return &user, nil
}

// verifyAccessKey verifies the user's access key
func verifyAccessKey(hashedKey, plainKey string) bool {
        parts := splitHashedKey(hashedKey)
        if len(parts) != 2 {
                return false
        }
        
        storedHash, err := base64.StdEncoding.DecodeString(parts[0])
        if err != nil {
                return false
        }
        
        salt, err := base64.StdEncoding.DecodeString(parts[1])
        if err != nil {
                return false
        }
        
        hash, err := scrypt.Key([]byte(plainKey), salt, 32768, 8, 1, 32)
        if err != nil {
                return false
        }
        
        return compareHashes(storedHash, hash)
}

// HTTP Handlers

// Authentication middleware
func authMiddleware(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
                session, _ := store.Get(r, "session")
                
                userID, ok := session.Values["user_id"].(string)
                if !ok || userID == "" {
                        writeErrorResponse(w, http.StatusUnauthorized, "Authentication required")
                        return
                }
                
                // Get user from database
                user, err := getUserByID(r.Context(), userID)
                if err != nil || user == nil {
                        writeErrorResponse(w, http.StatusUnauthorized, "Invalid session")
                        return
                }
                
                // Check if user is banned or frozen
                if user.IsBanned {
                        writeErrorResponse(w, http.StatusForbidden, "Account is banned")
                        return
                }
                
                if user.IsFrozen {
                        writeErrorResponse(w, http.StatusForbidden, "Account is frozen")
                        return
                }
                
                // Add user to request context
                ctx := context.WithValue(r.Context(), "user", user)
                next.ServeHTTP(w, r.WithContext(ctx))
        })
}

// Admin middleware
func adminMiddleware(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
                user := getUserFromContext(r.Context())
                if user == nil || !user.IsAdmin {
                        writeErrorResponse(w, http.StatusForbidden, "Admin access required")
                        return
                }
                
                next.ServeHTTP(w, r)
        })
}

// Register handler
func handleRegister(w http.ResponseWriter, r *http.Request) {
        var req RegisterRequest
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
                writeErrorResponse(w, http.StatusBadRequest, "Invalid request format")
                return
        }
        
        // Validate request
        if req.Username == "" || len(req.Username) < 3 || len(req.Username) > 20 {
                writeErrorResponse(w, http.StatusBadRequest, "Username must be 3-20 characters")
                return
        }
        
        if req.AccessKey == "" || len(req.AccessKey) < 6 {
                writeErrorResponse(w, http.StatusBadRequest, "Access key must be at least 6 characters")
                return
        }
        
        // Check if username already exists
        existingUser, err := getUserByUsername(r.Context(), req.Username)
        if err != nil {
                writeErrorResponse(w, http.StatusInternalServerError, "Database error")
                return
        }
        
        if existingUser != nil {
                writeErrorResponse(w, http.StatusConflict, "Username already exists")
                return
        }
        
        // Get client IP
        clientIP := getClientIP(r)
        
        // Create user
        user, err := createUser(r.Context(), req, clientIP)
        if err != nil {
                writeErrorResponse(w, http.StatusInternalServerError, "Failed to create user")
                return
        }
        
        // Create session
        session, _ := store.Get(r, "session")
        session.Values["user_id"] = user.ID
        session.Save(r, w)
        
        // Return user data (without sensitive fields)
        userResponse := map[string]interface{}{
                "id":                    user.ID,
                "username":              user.Username,
                "referralCode":          user.ReferralCode,
                "usdtBalance":           user.USDTBalance.String(),
                "btcBalance":            user.BTCBalance.String(),
                "hashPower":             user.HashPower.String(),
                "gbtcBalance":           user.GBTCBalance.String(),
                "unclaimedBalance":      user.UnclaimedBalance.String(),
                "totalReferralEarnings": user.TotalReferralEarnings.String(),
                "isAdmin":               user.IsAdmin,
                "hasStartedMining":      user.HasStartedMining,
                "kycVerified":           user.KYCVerified,
                "createdAt":             user.CreatedAt,
        }
        
        writeJSONResponse(w, http.StatusCreated, userResponse)
}

// Login handler
func handleLogin(w http.ResponseWriter, r *http.Request) {
        var req LoginRequest
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
                writeErrorResponse(w, http.StatusBadRequest, "Invalid request format")
                return
        }
        
        // Get user by username
        user, err := getUserByUsername(r.Context(), req.Username)
        if err != nil {
                writeErrorResponse(w, http.StatusInternalServerError, "Database error")
                return
        }
        
        if user == nil {
                writeErrorResponse(w, http.StatusUnauthorized, "Invalid credentials")
                return
        }
        
        // Verify access key
        if !verifyAccessKey(user.AccessKey, req.AccessKey) {
                writeErrorResponse(w, http.StatusUnauthorized, "Invalid credentials")
                return
        }
        
        // Check if user is banned or frozen
        if user.IsBanned {
                writeErrorResponse(w, http.StatusForbidden, "Account is banned")
                return
        }
        
        if user.IsFrozen {
                writeErrorResponse(w, http.StatusForbidden, "Account is frozen")
                return
        }
        
        // Create session
        session, _ := store.Get(r, "session")
        session.Values["user_id"] = user.ID
        session.Save(r, w)
        
        // Return user data (without sensitive fields)
        userResponse := map[string]interface{}{
                "id":                    user.ID,
                "username":              user.Username,
                "referralCode":          user.ReferralCode,
                "usdtBalance":           user.USDTBalance.String(),
                "btcBalance":            user.BTCBalance.String(),
                "hashPower":             user.HashPower.String(),
                "gbtcBalance":           user.GBTCBalance.String(),
                "unclaimedBalance":      user.UnclaimedBalance.String(),
                "totalReferralEarnings": user.TotalReferralEarnings.String(),
                "isAdmin":               user.IsAdmin,
                "hasStartedMining":      user.HasStartedMining,
                "kycVerified":           user.KYCVerified,
                "lastActiveBlock":       user.LastActiveBlock,
                "createdAt":             user.CreatedAt,
        }
        
        writeJSONResponse(w, http.StatusOK, userResponse)
}

// Get current user handler
func handleGetUser(w http.ResponseWriter, r *http.Request) {
        user := getUserFromContext(r.Context())
        if user == nil {
                writeErrorResponse(w, http.StatusUnauthorized, "Authentication required")
                return
        }
        
        // Return user data (without sensitive fields)
        userResponse := map[string]interface{}{
                "id":                    user.ID,
                "username":              user.Username,
                "referralCode":          user.ReferralCode,
                "usdtBalance":           user.USDTBalance.String(),
                "btcBalance":            user.BTCBalance.String(),
                "hashPower":             user.HashPower.String(),
                "baseHashPower":         user.BaseHashPower.String(),
                "referralHashBonus":     user.ReferralHashBonus.String(),
                "gbtcBalance":           user.GBTCBalance.String(),
                "unclaimedBalance":      user.UnclaimedBalance.String(),
                "totalReferralEarnings": user.TotalReferralEarnings.String(),
                "isAdmin":               user.IsAdmin,
                "hasStartedMining":      user.HasStartedMining,
                "kycVerified":           user.KYCVerified,
                "lastActiveBlock":       user.LastActiveBlock,
                "createdAt":             user.CreatedAt,
        }
        
        writeJSONResponse(w, http.StatusOK, userResponse)
}

// Logout handler
func handleLogout(w http.ResponseWriter, r *http.Request) {
        session, _ := store.Get(r, "session")
        session.Values["user_id"] = nil
        session.Options.MaxAge = -1
        session.Save(r, w)
        
        writeJSONResponse(w, http.StatusOK, map[string]string{"message": "Logged out successfully"})
}

// Mining endpoints

// Global stats endpoint
func handleGlobalStats(w http.ResponseWriter, r *http.Request) {
        stats := map[string]interface{}{
                "totalHashrate":       1000.0,
                "blockHeight":         1,
                "totalBlockHeight":    0,
                "activeMiners":        0,
                "blockReward":         50.0,
                "totalCirculation":    0.0,
                "maxSupply":           2100000,
                "nextHalving":         210000,
                "blocksUntilHalving":  210000,
        }
        
        // Get real data from database if possible
        var totalHashrate float64
        if err := db.QueryRow(r.Context(), 
                "SELECT COALESCE(SUM(hash_power), 0) FROM users").Scan(&totalHashrate); err == nil {
                stats["totalHashrate"] = totalHashrate
        }
        
        writeJSONResponse(w, http.StatusOK, stats)
}

// Purchase hash power endpoint  
func handlePurchasePower(w http.ResponseWriter, r *http.Request) {
        user := getUserFromContext(r.Context())
        if user == nil {
                writeErrorResponse(w, http.StatusUnauthorized, "Unauthorized")
                return
        }
        
        var req struct {
                Amount float64 `json:"amount"`
        }
        
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
                writeErrorResponse(w, http.StatusBadRequest, "Invalid request format")
                return
        }
        
        if req.Amount < 1 {
                writeErrorResponse(w, http.StatusBadRequest, "Minimum purchase is 1 USDT")
                return
        }
        
        // Check balance
        if user.USDTBalance.LessThan(decimal.NewFromFloat(req.Amount)) {
                writeErrorResponse(w, http.StatusBadRequest, "Insufficient USDT balance")
                return
        }
        
        // Update user balances - deduct USDT, add hash power
        newUSDT := user.USDTBalance.Sub(decimal.NewFromFloat(req.Amount))
        newHashPower := user.HashPower.Add(decimal.NewFromFloat(req.Amount))
        
        _, err := db.Exec(r.Context(), 
                "UPDATE users SET usdt_balance = $1, hash_power = $2 WHERE id = $3",
                newUSDT.String(), newHashPower.String(), user.ID)
        
        if err != nil {
                writeErrorResponse(w, http.StatusInternalServerError, "Failed to purchase hash power")
                return
        }
        
        writeJSONResponse(w, http.StatusOK, map[string]string{"message": "Hash power purchased successfully"})
}

// Start mining endpoint
func handleStartMining(w http.ResponseWriter, r *http.Request) {
        user := getUserFromContext(r.Context())
        if user == nil {
                writeErrorResponse(w, http.StatusUnauthorized, "Unauthorized")
                return
        }
        
        if user.HashPower.LessThanOrEqual(decimal.Zero) {
                writeErrorResponse(w, http.StatusBadRequest, "Hash power required to start mining")
                return
        }
        
        // Mark user as having started mining
        _, err := db.Exec(r.Context(), 
                "UPDATE users SET has_started_mining = true WHERE id = $1", user.ID)
        
        if err != nil {
                writeErrorResponse(w, http.StatusInternalServerError, "Failed to start mining")
                return
        }
        
        writeJSONResponse(w, http.StatusOK, map[string]string{"message": "Mining started successfully"})
}

// Claim rewards endpoint
func handleClaimRewards(w http.ResponseWriter, r *http.Request) {
        user := getUserFromContext(r.Context())
        if user == nil {
                writeErrorResponse(w, http.StatusUnauthorized, "Unauthorized")
                return
        }
        
        if user.UnclaimedBalance.LessThanOrEqual(decimal.Zero) {
                writeErrorResponse(w, http.StatusBadRequest, "No rewards to claim")
                return
        }
        
        // Move unclaimed to GBTC balance
        newGBTC := user.GBTCBalance.Add(user.UnclaimedBalance)
        
        _, err := db.Exec(r.Context(), 
                "UPDATE users SET gbtc_balance = $1, unclaimed_balance = '0' WHERE id = $2",
                newGBTC.String(), user.ID)
        
        if err != nil {
                writeErrorResponse(w, http.StatusInternalServerError, "Failed to claim rewards")
                return
        }
        
        writeJSONResponse(w, http.StatusOK, map[string]string{"message": "Rewards claimed successfully"})
}

// BTC related endpoints
func handleBTCPrices(w http.ResponseWriter, r *http.Request) {
        prices := map[string]interface{}{
                "btcPrice":                "95000.00",
                "hashratePrice":           "1.00", 
                "requiredHashratePerBTC":  95000.0,
                "timestamp":               "2025-01-18T12:00:00Z",
        }
        
        writeJSONResponse(w, http.StatusOK, prices)
}

func handleBTCBalance(w http.ResponseWriter, r *http.Request) {
        user := getUserFromContext(r.Context())
        if user == nil {
                writeErrorResponse(w, http.StatusUnauthorized, "Unauthorized")
                return
        }
        
        writeJSONResponse(w, http.StatusOK, map[string]string{
                "btcBalance": user.BTCBalance.String(),
        })
}

// Referrals endpoint
func handleReferrals(w http.ResponseWriter, r *http.Request) {
        user := getUserFromContext(r.Context())
        if user == nil {
                writeErrorResponse(w, http.StatusUnauthorized, "Unauthorized")
                return
        }
        
        referralCode := user.Username[:min(6, len(user.Username))] + "123"
        if user.ReferralCode != nil {
                referralCode = *user.ReferralCode
        }
        
        response := map[string]interface{}{
                "referralCode":    referralCode,
                "totalReferrals":  0,
                "activeReferrals": 0,
                "totalEarnings":   user.TotalReferralEarnings.String(),
                "referrals":       []interface{}{},
        }
        
        writeJSONResponse(w, http.StatusOK, response)
}

// Utility functions
func writeJSONResponse(w http.ResponseWriter, statusCode int, data interface{}) {
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(statusCode)
        json.NewEncoder(w).Encode(data)
}

func writeErrorResponse(w http.ResponseWriter, statusCode int, message string) {
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(statusCode)
        json.NewEncoder(w).Encode(ErrorResponse{Message: message})
}

func getUserFromContext(ctx context.Context) *User {
        if user, ok := ctx.Value("user").(*User); ok {
                return user
        }
        return nil
}

func getClientIP(r *http.Request) string {
        // Check X-Forwarded-For header first
        if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
                // X-Forwarded-For can contain multiple IPs, take the first one
                if ips := strings.Split(xff, ","); len(ips) > 0 {
                        return strings.TrimSpace(ips[0])
                }
        }
        
        // Check X-Real-IP header
        if xri := r.Header.Get("X-Real-IP"); xri != "" {
                return strings.TrimSpace(xri)
        }
        
        // Fall back to RemoteAddr
        ip := r.RemoteAddr
        if colon := strings.LastIndex(ip, ":"); colon != -1 {
                ip = ip[:colon]
        }
        
        return ip
}

func generateReferralCode(username string) string {
        // Simple referral code generation - first 6 chars of username in uppercase
        code := username
        if len(code) > 6 {
                code = code[:6]
        }
        return fmt.Sprintf("%s%d", code, time.Now().Unix()%1000)
}

func splitHashedKey(hashedKey string) []string {
        // Split the hashed key by ":" separator
        parts := make([]string, 0, 2)
        start := 0
        for i, r := range hashedKey {
                if r == ':' {
                        parts = append(parts, hashedKey[start:i])
                        start = i + 1
                }
        }
        if start < len(hashedKey) {
                parts = append(parts, hashedKey[start:])
        }
        return parts
}

func compareHashes(a, b []byte) bool {
        if len(a) != len(b) {
                return false
        }
        
        result := byte(0)
        for i := 0; i < len(a); i++ {
                result |= a[i] ^ b[i]
        }
        
        return result == 0
}

func min(a, b int) int {
        if a < b {
                return a
        }
        return b
}

func main() {
        // Initialize database connection
        dbURL := os.Getenv("DATABASE_URL")
        if dbURL == "" {
                log.Fatal("DATABASE_URL must be set")
        }

        var err error
        db, err = pgxpool.Connect(context.Background(), dbURL)
        if err != nil {
                log.Fatalf("Failed to connect to database: %v", err)
        }
        defer db.Close()

        // Initialize session store
        sessionSecret := os.Getenv("SESSION_SECRET")
        if sessionSecret == "" {
                sessionSecret = "your-secret-key-change-in-production"
        }
        store = sessions.NewCookieStore([]byte(sessionSecret))
        store.Options = &sessions.Options{
                Path:     "/",
                MaxAge:   86400 * 7, // 7 days
                HttpOnly: true,
                Secure:   false, // Set to true in production with HTTPS
                SameSite: http.SameSiteDefaultMode,
        }

        r := chi.NewRouter()

        // CORS configuration for Replit proxy
        r.Use(cors.Handler(cors.Options{
                AllowedOrigins:   []string{"*"},
                AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
                AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
                ExposedHeaders:   []string{"Link"},
                AllowCredentials: true,
                MaxAge:           300,
        }))

        // Health check endpoint
        r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
                writeJSONResponse(w, http.StatusOK, map[string]string{"status": "ok", "service": "bit2block-mining-go"})
        })

        // Authentication routes
        r.Post("/api/auth/register", handleRegister)
        r.Post("/api/auth/login", handleLogin)
        r.Post("/api/auth/logout", handleLogout)

        // Protected routes
        r.Group(func(r chi.Router) {
                r.Use(authMiddleware)
                
                // User routes
                r.Get("/api/user", handleGetUser)
                
                // Mining routes
                r.Get("/api/global-stats", handleGlobalStats)
                r.Post("/api/purchase-power", handlePurchasePower)
                r.Post("/api/start-mining", handleStartMining)
                r.Post("/api/claim-rewards", handleClaimRewards)
                
                // BTC routes
                r.Get("/api/btc/prices", handleBTCPrices)
                r.Get("/api/btc/balance", handleBTCBalance)
                
                // Referral routes
                r.Get("/api/referrals", handleReferrals)
        })

        // Test endpoint
        r.Get("/api/test", func(w http.ResponseWriter, r *http.Request) {
                writeJSONResponse(w, http.StatusOK, map[string]string{"message": "Go backend is working!", "version": "1.0.0"})
        })

        // Start server on port 8080 for Go backend
        port := os.Getenv("GO_PORT")
        if port == "" {
                port = "8080" // Use different port than frontend
        }

        log.Printf("BIT2BLOCK Go Mining Backend starting on port %s", port)
        log.Printf("Database connected successfully")
        log.Printf("Ready to handle mining operations!")
        
        if err := http.ListenAndServe("localhost:"+port, r); err != nil {
                log.Fatal("Failed to start server:", err)
        }
}