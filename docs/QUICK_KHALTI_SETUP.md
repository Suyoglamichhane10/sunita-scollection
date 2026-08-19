# Quick Khalti Setup - 3 Simple Steps

## The Problem
You're seeing: `Khalti is not configured on the server. KHALTI_SECRET_KEY is missing or invalid`

This is **expected** because you haven't added your real Khalti test secret key yet.

## Solution - 3 Steps:

### Step 1: Get Your Free Khalti Test Secret Key (2 minutes)

1. **Open your browser and go to:**
   ```
   https://merchant.khalti.com/
   ```

2. **Sign up / Log in:**
   - If you don't have an account, click "Sign Up" and create a merchant account
   - It's free for testing
   - If you have an account, log in

3. **Get your Test Secret Key:**
   - After logging in, look for **"Settings"** (gear icon ⚙️) in the top menu
   - Click on **"API Keys"** or **"Integration"** in the settings menu
   - You'll see two sections:
     - **Test Environment** - Copy the **Test Secret Key**
     - **Live Environment** - This is for production later
   - The Test Secret Key looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6` (32 characters)

### Step 2: Add the Key to Your .env File (30 seconds)

1. **Open the file:** `server/.env` in your code editor

2. **Find this line** (around line 28):
   ```env
   KHALTI_SECRET_KEY=your_secret_key_here
   ```

3. **Replace it with your actual key:**
   ```env
   KHALTI_SECRET_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   ```
   (Use the actual 32-character key you copied from Khalti)

4. **Save the file** (Ctrl+S)

### Step 3: Restart Your Server (10 seconds)

1. **Stop the current server:**
   - Go to your terminal where the server is running
   - Press `Ctrl+C` to stop it

2. **Start the server again:**
   ```bash
   npm run dev
   # or
   npm start
   ```

3. **Look for success message:**
   - The error should be gone
   - Server should start normally

## Test It Works!

1. **Start the frontend** (if not already running):
   ```bash
   cd client
   npm run dev
   ```

2. **Open your browser:** http://localhost:5173

3. **Add a product to cart** and go to checkout

4. **Select "Khalti"** as payment method

5. **Click "Place Order"** - You should be redirected to Khalti's test payment page

6. **Use test credentials:**
   - Phone: `9800000000`
   - PIN: `111111`

7. **Complete the payment** - You should be redirected back to your success page

## Troubleshooting

### Still seeing the error?
- Double-check that you saved the `.env` file
- Make sure you restarted the server after saving
- Verify the key is exactly 32 characters (no spaces, no quotes)
- The key should be all lowercase letters and numbers

### Can't find the API Keys page?
- Make sure you're logged into https://merchant.khalti.com/
- Look for "Settings" → "API Keys" or "Integration Settings"
- If you can't find it, try refreshing the page
- Contact Khalti support at support@khalti.com if needed

### Server won't start?
- Check the terminal for error messages
- Make sure MongoDB is running
- Verify all other environment variables are set

## What the Key Looks Like

✅ **Correct format:**
```
KHALTI_SECRET_KEY=abcdef1234567890abcdef1234567890
```
- 32 characters long
- Only lowercase letters (a-f) and numbers (0-9)
- No spaces, no quotes, no special characters

❌ **Wrong formats:**
```
KHALTI_SECRET_KEY=your_secret_key_here          # Too short, placeholder
KHALTI_SECRET_KEY="abcdef123456..."             # Has quotes
KHALTI_SECRET_KEY=ABCDEF1234567890...           # Has uppercase
KHALTI_SECRET_KEY=abc def 123...                # Has spaces
```

## Need Help?

If you're stuck:
1. Check the server console for detailed error messages
2. Verify your Khalti merchant account is active
3. Make sure you're using the **Test** secret key, not the Live one
4. Contact Khalti support: support@khalti.com

## Next Steps After Success

Once the test payment works:
1. ✅ Test payment success scenario
2. ✅ Test payment failure (wrong PIN)
3. ✅ Test payment cancellation
4. ✅ Verify order status changes to "confirmed"
5. ✅ Verify stock is decremented
6. When ready for production, switch to Live mode (see KHALTI_PAYMENT_SETUP.md)

---

**Remember:** The error you're seeing is normal and expected until you add your real test key. Just follow the 3 steps above and you'll be up and running in 5 minutes!