# Try the bot yourself!

## Installation Setup:

Download the following modules:
```
npm install dotenv ssh2 discord.js -y
```

## Discord Bot Setup:

- Go to https://discord.com/developers/applications and select or create a bot.
- Copy the Application ID.
![image](https://github.com/yuan-miranda/dissh/assets/142481797/dba230d1-a107-4ea1-9340-96404ce52b09)
- Go to 'Bot' section and copy the bot's token (when its 'Reset Token', just do what it says).
![image](https://github.com/yuan-miranda/dissh/assets/142481797/5ac4ace5-e070-49ba-8b8b-adf79b2db77f)
- Enable the following Privileged Gateway Intents:
![image](https://github.com/yuan-miranda/dissh/assets/142481797/26160487-d1ff-403f-8e20-b9ce5e3e4160)
- And on the 'OAuth2' section, go to 'OAuth2 URL Generator', and select 'bot > Administrator' and copy the generated url and enter it on your browser to invite your bot on the server.

## Code Setup:
- After downloading the bot's source code, make a '.env' file inside the 'src' folder.
- Inside the '.env' file, do the following, **this is an example value**, paste your bot's Token and ID earlier.
  ![image](https://github.com/yuan-miranda/dissh/assets/142481797/22577ad6-9548-4aa4-9c86-ad7e0dcc7da0)

## Running the Bot:
- Execute the following commands/files:
```
cd src
node register_commands.js main.js
```

## Your done!
DM me in discord for questions about the setups, ill gladly help.

https://discord.com/users/830369392453615636
