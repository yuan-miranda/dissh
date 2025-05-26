## Discord Interactive Shell (dissh)
A discord bot capable of accessing remote shell.
> [bot.js](https://github.com/yuan-miranda/dissh/blob/main/bot.js) source code of the bot.<br>
> [deploy-commands.js](https://github.com/yuan-miranda/dissh/blob/main/deploy-commands.js) used to register the command.

## Installation Setup
**Note: You must have `Git`, `Node.js` and `npm` installed prior to this setup**.<br>
1. Clone the repository on your machine:
```
git clone https://github.com/yuan-miranda/dissh.git
```
2. Download the following modules inside the `dissh` directory:
```
npm install discord.js dotenv node-cron ssh2 strip-ansi -y
```
3. Setting up the discord bot:
  - Go to [Discord Developers Portal](https://discord.com/developers/applications) and select or create a bot.
  - Copy the Application ID (clientId). ![image](https://github.com/yuan-miranda/dissh/assets/142481797/dba230d1-a107-4ea1-9340-96404ce52b09)
  - On the left side panel, go to `Bot` section and copy the bot's token (when its 'Reset Token', just do what it says). ![image](https://github.com/yuan-miranda/dissh/assets/142481797/5ac4ace5-e070-49ba-8b8b-adf79b2db77f)
  - Scroll down and under the Privileged Gateway Intents, enable the following: ![image](https://github.com/yuan-miranda/dissh/assets/142481797/06396840-0b32-4056-a9aa-56cb44f4cc66)
  - And on the `OAuth2` section, go to `OAuth2 URL Generator`, and select `bot > Administrator` and copy the generated url and enter it on your browser to invite your bot on the server.
4. Create a `.env` file inside the root directory with the following values.
```
# .env contents
token=
clientId=
```
5. To run the bot, execute the following commands inside the root directory.
```
node deploy-commands.js
node bot.js
```
