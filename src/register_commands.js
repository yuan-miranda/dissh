const { REST, Routes } = require("discord.js");
require("dotenv").config({ path: `${__dirname}/.env` });

const commands = [
    {
        name: 'sshd',
        description: 'Start an SSH session. If no credentials are provided, the bot will attempt to use saved credentials.',
        options: [
            {
                name: 'host',
                description: 'The host to connect to.',
                type: 3,
                required: false
                
            },
            {
                name: 'port',
                description: 'The port to connect to.',
                type: 4,
                required: false
            },
            {
                name: 'username',
                description: 'The username to use.',
                type: 3,
                required: false
            },
            {
                name: 'password',
                description: 'The password to use.',
                type: 3,
                required: false
            }
        ]
    },
    {
        name: 'exit',
        description: 'Exit the current SSH session.',
        options: []
    },
    {
        name: 'purge',
        description: 'Delete your saved SSH credentials.',
    },
    {
        name: 'ssh',
        description: 'Execute a command in the current SSH session. (leave blank to update the output)',
        options: [
            {
                name: 'command',
                description: 'The command to execute. (leave blank to update the output)',
                type: 3,
                required: false
            }
        ]
    }
]

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');
      
        await rest.put(Routes.applicationCommands(process.env.BOT_ID), { body: commands });
      
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();