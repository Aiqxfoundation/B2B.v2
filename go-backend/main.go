package main

import (
        "context"
        "encoding/json"
        "log"
        "net/http"
        "os"
        "time"

        "github.com/go-chi/chi/v5"
        "github.com/go-chi/cors"
        "github.com/gorilla/sessions"
        "github.com/jackc/pgx/v4/pgxpool"
        "github.com/shopspring/decimal"
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

// LoginRequest represents the login request payload
type LoginRequest struct {
        Username  string `json:"username" validate:"required"`
        AccessKey string `json:"accessKey" validate:"required"`
}

// RegisterRequest represents the registration request payload
type RegisterRequest struct {
        Username     string  `json:"username" validate:"required,min=3,max=20"`
        AccessKey    string  `json:"accessKey" validate:"required,min=6"`
        ReferralCode *string `json:"referralCode,omitempty"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
        Message string `json:"message"`
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

// Basic user functions
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
                return nil, err
        }
        
        return &user, nil
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

        // Test endpoint
        r.Get("/api/test", func(w http.ResponseWriter, r *http.Request) {
                writeJSONResponse(w, http.StatusOK, map[string]string{"message": "Go backend is working!"})
        })

        // Basic login endpoint for testing
        r.Post("/api/login", func(w http.ResponseWriter, r *http.Request) {
                var req LoginRequest
                if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
                        writeErrorResponse(w, http.StatusBadRequest, "Invalid request format")
                        return
                }
                
                // Get user by username
                user, err := getUserByUsername(r.Context(), req.Username)
                if err != nil || user == nil {
                        writeErrorResponse(w, http.StatusUnauthorized, "Invalid credentials")
                        return
                }
                
                // For now, simple access key check (should implement proper hashing)
                if user.AccessKey != req.AccessKey {
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
        })

        port := os.Getenv("PORT")
        if port == "" {
                port = "5000"
        }

        log.Printf("Go backend starting on port %s", port)
        log.Fatal(http.ListenAndServe(":"+port, r))
}