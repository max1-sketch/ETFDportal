--[[
	Escape Tsunami — Ban Land GUI Script
	Put this in StarterGui (StarterGui > LocalScript)
	Shows the ban reason on screen when the player arrives in Ban Land.
]]

local Players = game:GetService("Players")
local HttpService = game:GetService("HttpService")

local RENDER_SERVER = "https://escape-tsunami-bans.onrender.com"

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- Remove any old GUI
local existing = playerGui:FindFirstChild("BanLandGui")
if existing then existing:Destroy() end

local function showBanScreen(reason, banType, duration, staff)
	local screenGui = Instance.new("ScreenGui")
	screenGui.Name = "BanLandGui"
	screenGui.ResetOnSpawn = false
	screenGui.IgnoreGuiInset = true
	screenGui.Parent = playerGui

	-- Full-screen dark background
	local bg = Instance.new("Frame")
	bg.Size = UDim2.new(1, 0, 1, 0)
	bg.BackgroundColor3 = Color3.fromRGB(10, 12, 20)
	bg.BorderSizePixel = 0
	bg.Parent = screenGui

	-- Title
	local title = Instance.new("TextLabel")
	title.Size = UDim2.new(0.8, 0, 0.15, 0)
	title.Position = UDim2.new(0.1, 0, 0.15, 0)
	title.BackgroundTransparency = 1
	title.Text = "YOU ARE BANNED"
	title.TextColor3 = Color3.fromRGB(255, 80, 80)
	title.Font = Enum.Font.GothamBold
	title.TextScaled = true
	title.Parent = bg

	-- Reason box
	local infoBox = Instance.new("Frame")
	infoBox.Size = UDim2.new(0.6, 0, 0.4, 0)
	infoBox.Position = UDim2.new(0.2, 0, 0.4, 0)
	infoBox.BackgroundColor3 = Color3.fromRGB(20, 24, 36)
	infoBox.BorderSizePixel = 0
	infoBox.Parent = bg

	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, 12)
	corner.Parent = infoBox

	local layout = Instance.new("UIListLayout")
	layout.Padding = UDim.new(0, 16)
	layout.HorizontalAlignment = Enum.HorizontalAlignment.Center
	layout.VerticalAlignment = Enum.VerticalAlignment.Center
	layout.Parent = infoBox

	local function makeLabel(text, color, size)
		local label = Instance.new("TextLabel")
		label.Text = text
		label.TextColor3 = color or Color3.fromRGB(255, 255, 255)
		label.Font = Enum.Font.Gotham
		label.TextScaled = true
		label.Size = UDim2.new(0.9, 0, 0.2, 0)
		label.BackgroundTransparency = 1
		label.Parent = infoBox
		return label
	end

	makeLabel("Type: " .. tostring(banType or "Ban"), Color3.fromRGB(255, 200, 100))
	makeLabel("Reason: " .. tostring(reason or "No reason provided"), Color3.fromRGB(255, 255, 255))
	makeLabel("Duration: " .. tostring(duration or "Permanent"), Color3.fromRGB(200, 200, 255))
	makeLabel("Staff: " .. tostring(staff or "Staff Team"), Color3.fromRGB(180, 180, 180))
end

-- Poll the Render server for ban status
task.spawn(function()
	while task.wait(15) do
		local username = player.Name
		local url = RENDER_SERVER .. "/api/check?username=" .. HttpService:URLEncode(username)

		local success, response = pcall(function()
			return HttpService:GetAsync(url)
		end)

		if success then
			local ok, data = pcall(function()
				return HttpService:JSONDecode(response)
			end)

			if ok and data then
				if data.banned == true then
					-- Player is still banned — show/update the ban screen
					local gui = playerGui:FindFirstChild("BanLandGui")
					if not gui then
						showBanScreen(data.reason, data.type, data.duration, data.staff)
					end
				else
					-- Player is NOT banned anymore — remove the ban screen
					local gui = playerGui:FindFirstChild("BanLandGui")
					if gui then
						gui:Destroy()
						-- Show "unbanned" message
						local msg = Instance.new("Message")
						msg.Text = "You have been unbanned! Rejoining the main game..."
						msg.Parent = workspace
						task.delay(4, function()
							msg:Destroy()
						end)
						-- Optional: teleport back to main game
						-- TeleportService:Teleport(MAIN_GAME_PLACE_ID, player)
					end
				end
			end
		end
	end
end)