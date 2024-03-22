### Discord Interace Shell (dissh)
A discord bot capable of accessing remote shell.

> [src/main.js](https://github.com/yuan-miranda/dissh/blob/main/src/main.js) source code of the bot.<br>
> [src/registering_commands.js](https://github.com/yuan-miranda/dissh/blob/main/src/register_commands.js) used to register the command.

## Slash Commands
Start an SSH session. If no credentials are provided, the bot will attempt to use saved credentials.
```
/sshd < | <host> <port> <username> <password>>
```
Exit the current SSH session.
```
/exit
```
Delete your saved SSH credentials.

```
/purge
```
Execute a command in the current SSH session.
```
/ssh <command>
```

### Installation Setup (For those who wants to try the source code)

Download the following modules:
```
npm install dotenv ssh2 discord.js -y
```

### Discord Bot Setup

- Go to https://discord.com/developers/applications and select or create a bot.
- Copy the Application ID.
![image](https://github.com/yuan-miranda/dissh/assets/142481797/dba230d1-a107-4ea1-9340-96404ce52b09)
- Go to `Bot` section and copy the bot's token (when its 'Reset Token', just do what it says).
![image](https://github.com/yuan-miranda/dissh/assets/142481797/5ac4ace5-e070-49ba-8b8b-adf79b2db77f)
- Enable the following Privileged Gateway Intents:
![image](https://github.com/yuan-miranda/dissh/assets/142481797/26160487-d1ff-403f-8e20-b9ce5e3e4160)
- And on the `OAuth2` section, go to `OAuth2 URL Generator`, and select 'bot > Administrator' and copy the generated url and enter it on your browser to invite your bot on the server.

### Code Setup
- After downloading the bot's source code, make a `.env` file inside the `src` folder.
- Inside the '.env' file, do the following, **this is an example value**, paste your bot's token and id instead.
![image](https://github.com/yuan-miranda/dissh/assets/142481797/574e0835-5c4c-490e-81ad-beec5f6c0c1e)

### Running the Bot
- Execute the following commands/files:
```
cd src
node register_commands.js main.js
```

### Your done!
DM me in discord for questions about the setups, ill gladly help.

https://discord.com/users/830369392453615636
