import {
	Client,
	GatewayIntentBits,
	Events,
	Interaction,
	Collection,
	EmbedBuilder,
	ActivityType
} from 'discord.js'
import { token, mongo, dbEnabled } from './config.json'
import BotCommand from './structures/BotCommand'
import fs from 'node:fs'
import mongoose from 'mongoose'
import path from 'node:path'

const client = new Client({
	intents: [
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.MessageContent
	]
})

const commands: Collection<string, BotCommand> = new Collection()

const commandFiles = fs.readdirSync(__dirname + '/commands/')
commandFiles.forEach(async (fileName: string) => {
	const command = (await import(`${__dirname}/commands/${fileName}`))
		.default as BotCommand
	commands.set(command.name, command)
})

const eventFiles: string[] = fs
	.readdirSync(path.join(__dirname, 'events'))
	.filter((s) => s.endsWith('.js'))
eventFiles.forEach(async (fileName: string) => {
	const event = (await import(path.join(__dirname, 'events', fileName))).default
	client.on(event.event, event.execute)
})

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
	if (!interaction.isChatInputCommand()) return

	if (commands.has(interaction.commandName)) {
		commands.get(interaction.commandName)?.execute(interaction)
	} else {
		await interaction.reply(
			'Hm, thats weird. A handler for this command does not exist..?'
		)
	}
})

client.on(Events.ClientReady, async () => {
	console.log(`Logged in as ${client.user?.tag}`)
})

process.on('uncaughtException', (err) =>
	console.log(`[CRASH PREVENTION - EXCEPTION]\n${err.stack}`)
)
process.on('unhandledRejection', (err) =>
	console.log(`[CRASH PREVENTION - REJECTION]\n${err}`)
)

client.login(token)
if (dbEnabled)
	mongoose.connect(mongo).then(() => console.log('Database connected.'))
