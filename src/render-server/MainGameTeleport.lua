--[[
	Escape Tsunami — MAIN GAME Teleport Script
	Put this in ServerScriptService of your MAIN game (NOT Ban Land).
	Checks the Render server when a player joins AND polls every 15 seconds
	so players banned mid-session also get teleported.
]]

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local TeleportService = game:GetService("TeleportService")

local BAN_SERVER_URL = "https://escape-tsunami-bans.onrender.com"
local BAN_LAND_PLACE_ID = 0000000000 -- <<< REPLACE WITH YOUR BAN LAND PLACE ID

local teleporting = {}

local function checkBanStatus(username)
	local url = BAN_SERVER_URL .. "/api/check?username=" .. HttpService:UrlEncode(username)

	local success, response = pcall(function()
		return HttpService:GetAsync(url)
	end)

	if not success then
		warn("[BanCheck] HTTP failed for " .. username .. ": " .. tostring(response))
		return nil
	end

	local ok, data = pcall(function()
		return HttpService:JSONDecode(response)
	end)

	if not ok or type(data) ~= "table" then
		warn("[BanCheck] JSON parse failed: " .. tostring(response))
		return nil
	end

	return data
end

local function teleportIfBanned(player)
	if teleporting[player.UserId] then return end
	if not player:IsDescendantOf(Players) then return end

	local data = checkBanStatus(player.Name)

	-- Retry once after a brief delay if the first check failed (Render cold start)
	if not data then
		task.wait(2)
		if not player:IsDescendantOf(Players) then return end
		data = checkBanStatus(player.Name)
	end

	if data and data.banned == true then
		print("[BanCheck] " .. player.Name .. " is banned — teleporting to Ban Land")
		teleporting[player.UserId] = true

		local ok, err = pcall(function()
			TeleportService:Teleport(BAN_LAND_PLACE_ID, player)
		end)

		if not ok then
			warn("[BanCheck] Teleport failed for " .. player.Name .. ": " .. tostring(err))
			teleporting[player.UserId] = nil
		end
	end
end

-- Check on join
Players.PlayerAdded:Connect(function(player)
	task.wait(3)
	teleportIfBanned(player)
end)

Players.PlayerRemoving:Connect(function(player)
	teleporting[player.UserId] = nil
end)

-- Poll all connected players every 5 seconds for mid-session bans
-- (faster polling so players banned from the portal get teleported quickly
--  without needing to rejoin)
task.spawn(function()
	while task.wait(5) do
		for _, player in ipairs(Players:GetPlayers()) do
			task.spawn(function()
				teleportIfBanned(player)
			end)
		end
	end
end)