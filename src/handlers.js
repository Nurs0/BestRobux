export async function TgOnMessageHandler(body) { 
    try { 
        let content = body.content.toJSON()
        console.log(content + " Content")

        console.log(`Validation return data: ${content}`)
    
        // validateReturnData(content)
    
        let status_code_info = STATUSCODES[content.status_code]
        let tx_id = content.tx_id 
    
        let ins = TransactionRepository.getInstance()
        let tx = ins.getByID(tx_id)
        if (tx === null || tx === undefined) { 
            return false 
        }
        ins.getUserByTransaction(tx_id, async (err, user) => {  
            if (err) { 
                console.error(err)
                return
            } 
            if (user === null || user === undefined) { 
                console.error("Can't pull users with transaction ids;")
                return 
            }
            await bot.sendMessage(user.user_id, `Ваша транзакция обработана, вот её результат: \n ${status_code_info}`)
        }) 
        return true 

    } catch (err) { 
        console.error(err)
    }
}

export async function startHandler(bot) {
    return async (msg) => {
        const chatId = msg.chat.id;
        const telegramUsername = msg.from.username;
        const userId = msg.from.id;
        const currentTime = new Date().toISOString();

        bot.sendMessage(chatId, "Приветствую тебя в моем магазине робуксов)\nНиже предоставлено мое меню. Для того, чтобы вызвать меню заново, используй клавиатуру Вызвать меню", againMenu);
        bot.sendMessage(chatId, "Вот мое меню:", Keyboard);

        db.get(`SELECT chatState FROM users WHERE tg_id = ?`, [userId], (err, row) => {
            if (err) {
                console.error(err.message);
                return;
            }
            let chatState = 'NormalUserState';
            if (row && row.chatState) {
                chatState = row.chatState;
            } else {
                db.run(`INSERT INTO users (telegramUsername, userId, timeReg) VALUES (?, ?, ?)`, [telegramUsername, userId, currentTime], function (err) {
                    if (err) {
                        console.error(err.message);
                        return;
                    }
                    console.log(`User ${telegramUsername} (${userId}) inserted into the database.`);
                });
            }
        });
    } 
}

export function addBalance(bot) {
    return async (msg, match) => { 
        const chatId = msg.chat.id;
        const adminUserId = msg.from.id;
        const targetUserId = parseInt(match[1]);
        const amount = parseInt(match[2]);
        if (isAdminUser(adminUserId)) {
            // Вызов функции для пополнения баланса пользователя
            increaseUserBalance(targetUserId, amount, (result) => {
                if (result.success) {
                    bot.sendMessage(chatId, `Баланс пользователя с ID ${targetUserId} успешно пополнен на ${amount}`);
                } else {
                    bot.sendMessage(chatId, `Не удалось пополнить баланс пользователя с ID ${targetUserId}`);
                }
            });
        } else {
            bot.sendMessage(chatId, "У вас нет прав на выполнение этой команды");
        }
    } 
}

export function minusBalance(bot) { 
    return (msg, match) => {
        const chatId = msg.chat.id;
        const adminUserId = msg.from.id;
        const targetUserId = parseInt(match[1]);
        const amount = parseInt(match[2]);
        if (isAdminUser(adminUserId)) {
            // Вызов функции для пополнения баланса пользователя
            minusUserBalance(targetUserId, amount, (result) => {
                if (result.success) {
                    bot.sendMessage(chatId, `Баланс пользователя с ID ${targetUserId} успешно понижен на ${amount}`);
                } else {
                    bot.sendMessage(chatId, `Не удалось понизить баланс пользователя с ID ${targetUserId}`);
                }
            });
        } else {
            bot.sendMessage(chatId, "У вас нет прав на выполнение этой команды");
        }
    }
}

export function blockUserHandler(bot) { 
    return async (msg, match) => {
        const chatId = msg.chat.id;
        const adminUserId = msg.from.id;
        const targetUserId = parseInt(match[1]);
        if (isAdminUser(adminUserId)) {
            blockUser(targetUserId, (result) => {
                if (result.success) {
                    bot.sendMessage(chatId, `Пользователь с ID ${targetUserId} успешно заблокирован`);
                } else {
                    bot.sendMessage(chatId, `Не удалось заблокировать пользователя с ID ${targetUserId}`);
                }
            });
        } else {
            bot.sendMessage(chatId, "У вас нет прав на выполнение этой команды");
        }
    }
}
