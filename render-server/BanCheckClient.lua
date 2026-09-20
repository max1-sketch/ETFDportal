--[[
	Escape Tsunami — Ban Check Client Script
	Put this in StarterPlayerScripts (StarterPlayer > StarterPlayerScripts)
	It runs on each player's client and teleports them to Ban Land if they're banned.
]]

local Players = game:GetService("Players")
local TeleportService = game:GetService("TeleportService")
local HttpService = game:GetService("HttpService")

local RENDER_SERVER = "https://escape-tsunami-bans.onrender.com"
local BAN_LAND_PLACE_ID = 0000000000 -- <<< REPLACE WITH YOUR BAN LAND PLACE ID

local player = Players.LocalPlayer

-- Prevent teleporting twice in the same session
local alreadyTeleported = false

local function checkBan()
	if alreadyTeleported then return end

	local username = player.Name
	local url = RENDER_SERVER .. "/api/check?username=" .. HttpService:URLEncode(username)

	local success, response = pcall(function()
		return HttpService:GetAsync(url)
	end)

	if not success then
		warn("[BanCheck] Failed to reach Render server: " .. tostring(response))
		return
	end

	local ok, data = pcall(function()
		return HttpService:JSONDecode(response)
	end)

	if not ok or not data then
		warn("[BanCheck] Could not parse server response: " .. tostring(response))
		return
	end

	if data.banned == true then
		print("[BanCheck] " .. username .. " is banned: " .. tostring(data.reason))
		alreadyTeleported = true

		-- Optional: show a message before teleporting
		local message = Instance.new("Message")
		message.Text = "You are banned: " .. tostring(data.reason or "Banned") .. " — teleporting to Ban Land..."
		message.Parent = workspace
		task.delay(3, function()
			message:Destroy()
		end)

		-- Teleport to Ban Land
		local tpOk, tpErr = pcall(function()
			TeleportService:Teleport(BAN_LAND_PLACE_ID, player)
		end)

		if not tpOk then
			warn("[BanCheck] Teleport failed: " .. tostring(tpErr))
			alreadyTeleported = false
		end
	else
		print("[BanCheck] " .. username .. " is not banned.")
	end
end

-- Check shortly after joining (give the player a moment to load)
task.delay(3, checkBan)

-- Also re-check every 30 seconds in case a ban is issued mid-session
task.spawn(function()
	while task.wait(30) do
		if not alreadyTeleported then
			checkBan()
		end
	end
end)