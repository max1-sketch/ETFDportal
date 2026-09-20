--[[
	Escape Tsunami — Ban Land GUI (LocalScript)
	Put this in StarterGui > LocalScript (in BAN LAND, not the main game)
	Shows the ban reason and auto-updates when unbanned.
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local getBanData = ReplicatedStorage:WaitForChild("GetBanData")

local function createGui(data)
	-- Remove old GUI if it exists
	local existing = playerGui:FindFirstChild("BanLandGui")
	if existing then existing:Destroy() end

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

	local corner = Instance.new("UICorner")
	corner.Parent = bg

	-- Title
	local title = Instance.new("TextLabel")
	title.Size = UDim2.new(0.8, 0, 0.12, 0)
	title.Position = UDim2.new(0.1, 0, 0.12, 0)
	title.BackgroundTransparency = 1
	title.Text = "YOU ARE BANNED"
	title.TextColor3 = Color3.fromRGB(255, 80, 80)
	title.Font = Enum.Font.GothamBold
	title.TextScaled = true
	title.Parent = bg

	-- Info container
	local infoBox = Instance.new("Frame")
	infoBox.Size = UDim2.new(0.6, 0, 0.45, 0)
	infoBox.Position = UDim2.new(0.2, 0, 0.35, 0)
	infoBox.BackgroundColor3 = Color3.fromRGB(20, 24, 36)
	infoBox.BorderSizePixel = 0
	infoBox.Parent = bg

	local infoCorner = Instance.new("UICorner")
	infoCorner.CornerRadius = UDim.new(0, 12)
	infoCorner.Parent = infoBox

	local layout = Instance.new("UIListLayout")
	layout.Padding = UDim.new(0, 14)
	layout.HorizontalAlignment = Enum.HorizontalAlignment.Center
	layout.VerticalAlignment = Enum.VerticalAlignment.Center
	layout.Parent = infoBox

	local function makeLabel(text, color)
		local label = Instance.new("TextLabel")
		label.Text = text
		label.TextColor3 = color or Color3.fromRGB(255, 255, 255)
		label.Font = Enum.Font.Gotham
		label.TextScaled = true
		label.Size = UDim2.new(0.9, 0, 0.22, 0)
		label.BackgroundTransparency = 1
		label.Parent = infoBox
		return label
	end

	makeLabel("Reason: " .. (data.Reason or "No reason provided"), Color3.fromRGB(255, 255, 255))
	makeLabel("Duration: " .. (data.Duration or "Permanent"), Color3.fromRGB(200, 200, 255))
	makeLabel("Staff: " .. (data.AdminUser or "Staff Team"), Color3.fromRGB(180, 180, 180))
end

-- Poll the server every 10 seconds for live updates
task.spawn(function()
	while task.wait(10) do
		local ok, data = pcall(function()
			return getBanData:InvokeServer()
		end)

		if ok and data then
			createGui(data)
		elseif ok and not data then
			-- Not banned anymore — the server script will kick us,
			-- but destroy the GUI just in case
			local existing = playerGui:FindFirstChild("BanLandGui")
			if existing then
				existing:Destroy()
			end
		end
	end
end)