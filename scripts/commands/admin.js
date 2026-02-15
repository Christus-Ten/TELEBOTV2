const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../../config.json');

function readConfig() {
    try {
        const data = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (!data.adminId) data.adminId = [];
        return data;
    } catch (e) {
        return { adminId: [] };
    }
}

function writeConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

module.exports = {
    config: {
        name: "admin",
        aliases: ["admin"],
        role: 2,
        cooldowns: 5,
        version: '1.0.4',
        author: 'Samir Thakuri (fixed by Christus)',
        category: "admin",
        description: "Manage admins.",
        usage: "admin <list|-l|add|-a|remove|-r> <userId>",
    },

    onStart: async function ({ bot, msg, args }) {
        try {
            if (args.length === 0) {
                return bot.sendMessage(msg.chat.id, "Usage: /admin <list|add|remove>", { replyToMessage: msg.message_id });
            }

            const action = args[0].toLowerCase();
            const chatId = msg.chat.id;

            if (action === "list" || action === "-l") {
                return listAdmins(bot, chatId, msg);
            }

            if (action === "add" || action === "-a") {
                const userId = args[1] || (msg.reply_to_message && msg.reply_to_message.from.id);
                if (!userId) {
                    return bot.sendMessage(chatId, "Reply to user or give ID.", { replyToMessage: msg.message_id });
                }
                return addAdmin(bot, chatId, userId.toString(), msg);
            }

            if (action === "remove" || action === "-r") {
                const userId = args[1] || (msg.reply_to_message && msg.reply_to_message.from.id);
                if (!userId) {
                    return bot.sendMessage(chatId, "Reply to user or give ID.", { replyToMessage: msg.message_id });
                }
                return removeAdmin(bot, chatId, userId.toString(), msg);
            }

        } catch (err) {
            console.error(err);
            bot.sendMessage(msg.chat.id, "❌ Command error.");
        }
    }
};

async function listAdmins(bot, chatId, msg) {
    try {
        const config = readConfig();
        const admins = config.adminId || [];

        if (admins.length === 0) {
            return bot.sendMessage(chatId, "No admins found.", { replyToMessage: msg.message_id });
        }

        let message = "👑 Admin List:\n";

        for (const userId of admins) {
            try {
                const user = await bot.getChatMember(chatId, userId);
                const fullName = user.user.first_name + (user.user.last_name ? ` ${user.user.last_name}` : "");
                message += `» ${fullName} (${userId})\n`;
            } catch {
                message += `» Unknown (${userId})\n`;
            }
        }

        bot.sendMessage(chatId, message, { replyToMessage: msg.message_id });

    } catch (e) {
        bot.sendMessage(chatId, "❌ Failed to list admins.");
    }
}

async function addAdmin(bot, chatId, userId, msg) {
    try {
        const config = readConfig();
        const admins = config.adminId || [];

        if (admins.includes(userId)) {
            return bot.sendMessage(chatId, "User already admin.", { replyToMessage: msg.message_id });
        }

        admins.push(userId);
        config.adminId = admins;
        writeConfig(config);

        bot.sendMessage(chatId, `✅ Added admin: ${userId}`, { replyToMessage: msg.message_id });

    } catch (e) {
        bot.sendMessage(chatId, "❌ Failed to add admin.");
    }
}

async function removeAdmin(bot, chatId, userId, msg) {
    try {
        const config = readConfig();
        const admins = config.adminId || [];

        if (!admins.includes(userId)) {
            return bot.sendMessage(chatId, "User not admin.", { replyToMessage: msg.message_id });
        }

        config.adminId = admins.filter(id => id !== userId);
        writeConfig(config);

        bot.sendMessage(chatId, `✅ Removed admin: ${userId}`, { replyToMessage: msg.message_id });

    } catch (e) {
        bot.sendMessage(chatId, "❌ Failed to remove admin.");
    }
}
