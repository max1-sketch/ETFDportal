--[[
	Escape Tsunami — BAN LAND Server Script
	Put this in ServerScriptService (ServerScriptService > Script)
	Checks if players in Ban Land are still banned, kicks them when unbanned.
]]

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local BAN_SERVER_URL = "https://escape-tsunami-bans.onrender.com"

--------------------------------------------------------------------------------
-- SETUP REMOTE FUNCTION FOR CLIENT GUI
--------------------------------------------------------------------------------
local getBanDataFunc = ReplicatedStorage:FindFirstChild("GetBanData")
if not getBanDataFunc then
	getBanDataFunc = Instance.new("RemoteFunction")
	getBanDataFunc.Name = "GetBanData"
	getBanDataFunc.Parent = ReplicatedStorage
end

local banCache = {}

--------------------------------------------------------------------------------
-- CHECK RENDER SERVER
--------------------------------------------------------------------------------
local function checkBanStatus(username)
	local url = BAN_SERVER_URL .. "/api/check?username=" .. HttpService:UrlEncode(username)

	local success, response = pcall(function()
		return HttpService:GetAsync(url)
	end)

	if not success then
		warn("[BanLand] HTTP failed for " .. username .. ": " .. tostring(response))
		return nil
	end

	local ok, data = pcall(function()
		return HttpService:JSONDecode(response)
	end)

	if not ok or type(data) ~= "table" then
		warn("[BanLand] JSON parse failed: " .. tostring(response))
		return nil
	end

	return data
end

--------------------------------------------------------------------------------
-- REMOTE FUNCTION HANDLER (Client UI Fetch)
--------------------------------------------------------------------------------
getBanDataFunc.OnServerInvoke = function(invokingPlayer)
	-- Always fetch fresh data so the GUI updates live
	local data = checkBanStatus(invokingPlayer.Name)
	if data and data.banned == true then
		local formatted = {
			Reason = data.reason or "No reason provided",
			AdminUser = data.staff or "Staff Team",
			Duration = data.duration or "Permanent"
		}
		banCache[invokingPlayer.UserId] = formatted
		return formatted
	end

	-- Not banned — clear cache
	banCache[invokingPlayer.UserId] = nil
	return nil
end

--------------------------------------------------------------------------------
-- UNBAN HANDLER
--------------------------------------------------------------------------------
local function handleUnban(player)
	if not player or not player:IsDescendantOf(Players) then return end
	banCache[player.UserId] = nil
	print("Unban verified for " .. player.Name)
	player:Kick("\n\n[SECURITY SYSTEM]\nYour ban record has been cleared.\n\nStatus: UNBANNED\nAction: Please rejoin the main game.")
end

--------------------------------------------------------------------------------
-- PLAYER JOIN & POLLING
--------------------------------------------------------------------------------
Players.PlayerAdded:Connect(function(player)
	task.wait(1)

	local data = checkBanStatus(player.Name)

	-- Retry once if the first request failed (Render cold start)
	if not data then
		task.wait(4)
		data = checkBanStatus(player.Name)
	end

	if not data or data.banned ~= true then
		-- Player is in Ban Land but not banned — kick them out
		handleUnban(player)
		return
	end

	-- Cache formatted payload for the client UI
	banCache[player.UserId] = {
		Reason = data.reason or "No reason provided",
		AdminUser = data.staff or "Staff Team",
		Duration = data.duration or "Permanent"
	}

	print("[BAN LAND] " .. player.Name .. " is banned — Reason: " .. (data.reason or "Unknown"))

	-- Live polling — check every 15 seconds for unban
	task.spawn(function()
		while player and player:IsDescendantOf(Players) do
			task.wait(15)
			local fresh = checkBanStatus(player.Name)
			if fresh and fresh.banned ~= true then
				handleUnban(player)
				break
			end
		end
	end)
end)

Players.PlayerRemoving:Connect(function(player)
	banCache[player.UserId] = nil
end)