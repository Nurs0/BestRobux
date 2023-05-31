const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot("5605925167:AAHEJZgNsc7NyKtcSCfJ1C0emJc5PCvVjNs", { polling: true });
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db');
const amqp = require('amqplib');

let chatState = {};
let costnumber;
let payment;
let vivodNumber;
let gamePassLink = '';
let userMessage

bot.on("callback_query", (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    const messageId = callbackQuery.message.message_id;
    if (data === "buyRobux") {
        const message = `Какое количество робуксов вы желаете купить?`;
        bot.editMessageText(message, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Вернуться назад",
                            callback_data: "backToMenu"
                        }
                    ]
                ]
            }
        });
        chatState[chatId] = "waitMoneyAmount"
    } else if (data === "calculator") {
        bot.editMessageText("🧮 Я калькулятор, для подсчета робуксов \n[Курс робуксов -> 1 руб - 1.8 робукса]\n", {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Подсчитать стоимость геймпасса",
                            callback_data: "gamepassCostCalculator",
                        }
                    ],
                    [
                        {
                            text: "Подсчитать стоимость робуксов",
                            callback_data: "robuxCostCalculator",
                        }
                    ],
                    [
                        {
                            text: "Вернуться назад",
                            callback_data: "backToMenu",
                        }
                    ]
                ]
            }
        })
    } else if (data === "giveaway") {
        const userId = callbackQuery.from.id;
        db.get(`SELECT userBalance FROM users WHERE userId = ?`, [userId], function (err, row) {
            if (err) {
                return console.error(err.message);
            }
            const balance = row ? row.userBalance : 0;
            bot.editMessageText(`Ваш текующий баланс робуксов: ${balance}\nСколько робуксов вы хотите вывести?`, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Вернуться назад",
                                callback_data: "backToMenu"
                            }
                        ]
                    ]
                }
            })
            chatState[chatId] = "vivodMoney"
        })

    } else if (data === "profile") {
        const userId = callbackQuery.from.id;
        db.get(`SELECT userBalance FROM users WHERE userId = ?`, [userId], function (err, row) {
            if (err) {
                return console.error(err.message);
            }
            const balance = row ? row.userBalance : 0;
            const profile = `
👤 Ваш профиль: 
🆔 Ваш айди - ${chatId}
💰 Ваш баланс - ${balance} робуксов
        `
            bot.editMessageText(profile, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Пополнить баланс",
                                callback_data: "buyRobux"
                            }
                        ],
                        [
                            {
                                text: "Вернуться назад",
                                callback_data: "backToMenu"
                            }
                        ]
                    ]
                }
            })
        })

    } else if (data === "balance") {
        const userId = callbackQuery.from.id;
        db.get(`SELECT userBalance FROM users WHERE userId = ?`, [userId], function (err, row) {
            if (err) {
                return console.error(err.message);
            }
            const balance = row ? row.userBalance : 0;
            bot.editMessageText(`Ваш текующий баланс: ${balance} робуксов\n Вы можете пополнить баланс по команде ниже`, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Вернуться назад",
                                callback_data: "backToMenu"
                            }
                        ]
                    ]
                }
            })
        })

    } else if (data === "newsChanel") {
        bot.editMessageText(`Новостной канал:`, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Вернуться назад",
                            callback_data: "backToMenu"
                        }
                    ]
                ]
            }
        })
    } else if (data === "helpAdmin") {
        bot.editMessageText(`Тех поддержка в режиме 24/7 \nВоспользуйтесь командой ниже, чтобы наши операторы смогли с вами связаться`, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Вернуться назад",
                            callback_data: "backToMenu"
                        }
                    ]
                ]
            }
        })
    } else if (data === "backToMenu") {
        const message = "Вот мое меню:";
        chatState[chatId] = "userState"
        bot.editMessageText(message, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "💸Купить R$💸", callback_data: "buyRobux"
                        },
                        {
                            text: "💲Вывести💲", callback_data: "giveaway"
                        }
                    ],
                    [
                        {
                            text: "👤Профиль👤", callback_data: "profile"
                        }
                    ],
                    [
                        {
                            text: "🧍Поддержка🧍", callback_data: "helpAdmin"
                        },
                        {
                            text: "📰Новости📰", callback_data: "newsChanel"
                        }
                    ],
                    [
                        {
                            text: "💰Баланс💰", callback_data: "balance"
                        },
                        {
                            text: '🏦Калькулятор🏦', callback_data: "calculator"
                        }
                    ]
                ]
            }
        }
        )
    } else if (data === "paySberbank") {
        payment = "Сбербанк"
        bot.editMessageText(`Сбер карта -> 2202 2023 4153 6872\n[Дмитрий Тимофеевич Ш.]\nОбязательно в качестве комментария пришлите ваш айди!\nВаш айди: ${chatId}\nПосле оплаты, жмите на эту кнопку`, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Я оплатил",
                            callback_data: "userOplatil"
                        }
                    ],
                    [
                        {
                            text: "Назад",
                            callback_data: "buyRobux"
                        }
                    ]
                ]
            }
        })
    } else if (data === "payTinkoff") {
        payment = "Тинькофф"
        bot.editMessageText(`Тинькофф карта -> 2200 7007 1276 5014\n[Дмитрий Тимофеевич Ш.]\nОбязательно в качестве комментария пришлите ваш айди!\nВаш айди: ${chatId}\nПосле оплаты, жмите на эту кнопку`, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Я оплатил",
                            callback_data: "userOplatil"
                        }
                    ],
                    [
                        {
                            text: "Назад",
                            callback_data: "buyRobux"
                        }
                    ]
                ]
            }
        })
    } else if (data === "payQIWI") {
        payment = "Киви"
        bot.editMessageText(`QIWI номер -> +7 961 439 77 99\nОбязательно в качестве комментария пришлите ваш айди!\nВаш айди: ${chatId}\nПосле оплаты, жмите на эту кнопку`, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Я оплатил",
                            callback_data: "userOplatil"
                        }
                    ],
                    [
                        {
                            text: "Назад",
                            callback_data: "buyRobux"
                        }
                    ]
                ]
            }
        })
    } else if (data === "payKaspi") {
        payment = "Каспи"
        bot.editMessageText(`KASPIBANK номер -> +7 708 987 95 12\nОбязательно в качестве комментария пришлите ваш айди!\nВаш айди: ${chatId}\nПосле оплаты, жмите на эту кнопку`, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Я оплатил",
                            callback_data: "userOplatil"
                        }
                    ],
                    [
                        {
                            text: "Назад",
                            callback_data: "buyRobux"
                        }
                    ]
                ]
            }
        })
    } else if (data === "userOplatil") {
        bot.editMessageText(`Ваша заявка принята! \nОжидайте пополнение в течении 3-х часов!`, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Вернуться в меню",
                            callback_data: "backToMenu"
                        }
                    ]
                ]
            }
        })
        bot.sendMessage(809124390, `Поступила заявка от пользователя ${chatId}, на сумму ${costnumber}\nОплата была сделана через ${payment}`)
    } else if (data === "gamepassCostCalculator") {
    } else if (data === "gamepassCostCalculator") {
    } else if (data === "vivodDa") {
        bot.editMessageText(`Вы собираетесь выводить ${vivodNumber} робуксов! \nТеперь введите ссылку на геймпасс:`, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Вернуться в меню",
                            callback_data: "backToMenu"
                        }
                    ]
                ]
            }
        })
    }
})
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    if (msg.text === "Вызвать меню") {
        bot.sendMessage(chatId, "Вот мое меню:", Keyboard)
    }
    if (chatState[chatId] === "waitMoneyAmount") {
        if (msg.text === msg.text) {
            if (msg.text > 0) {
                const number = msg.text
                costnumber = number * 0.59
                chatState[chatId] = "waitMoneyAmount"
                const keyboardPayments = {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "Сбербанк", callback_data: "paySberbank"
                                },
                                {
                                    text: "Тинькофф", callback_data: "payTinkoff"
                                }
                            ],
                            [
                                {
                                    text: "QIWI кошельек", callback_data: "payQIWI"
                                }
                            ],
                            [
                                {
                                    text: "KaspiBank [тенге]", callback_data: "payKaspi"
                                }
                            ]
                        ]
                    }
                }
                bot.sendMessage(chatId, `Вы хотите приобрести ${number} робуксов\nК оплате: ${costnumber} рублей\nВыберите ваш метод оплаты:`, keyboardPayments).then(chatState[chatId] = "lol")
                return costnumber
            } else {
                bot.sendMessage(chatId, "Вы неправильно ввели сумму для платежа! Попробуйте еще раз")
            }
        }
    }
    else if (chatState[chatId] === "vivodMoney") {
        if (msg.text === msg.text) {
            if (msg.text > 0) {
                const number = msg.text
                vivodNumber = number * 0.59
                chatState[chatId] = "vivodMoney"
                const keyboardPayments = {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "Да", callback_data: "vivodDa"
                                }
                            ],
                            [
                                {
                                    text: "Нет", callback_data: "vivodNet"
                                }
                            ]
                        ]
                    }
                }
                bot.sendMessage(chatId, `Вы хотите вывести ${number} робуксов?\n`, keyboardPayments).then(chatState[chatId] = "lol")
                // Отправка сообщения в RabbitMQ
                // sendToRabbitMQ(message);
            } else {
                bot.sendMessage(chatId, "Вы неправильно ввели сумму для вывода! Попробуйте еще раз")
            }
        }
    }

})

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const messageText = msg.text;
    if (messageId === msg.reply_to_message.message_id) {
        gamepassLink = messageText;
        bot.sendMessage(809124390, gamePassLink)
    }
});

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const telegramUsername = msg.from.username;
    const userId = msg.from.id;
    const currentTime = new Date().toISOString();

    bot.sendMessage(chatId, "Приветствую тебя в моем магазине робуксов)\nНиже предоставлено мое меню. Для того, чтобы вызвать меню заново, используй клавиатуру Вызвать меню", againMenu);
    bot.sendMessage(chatId, "Вот мое меню:", Keyboard);

    db.get(`SELECT chatState FROM users WHERE userId = ?`, [userId], (err, row) => {
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
});

const Keyboard = {
    reply_markup: {
        inline_keyboard: [
            [
                {
                    text: "💸Купить R$💸", callback_data: "buyRobux"
                },
                {
                    text: "💲Вывести💲", callback_data: "giveaway"
                }
            ],
            [
                {
                    text: "👤Профиль👤", callback_data: "profile"
                }
            ],
            [
                {
                    text: "🧍Поддержка🧍", callback_data: "helpAdmin"
                },
                {
                    text: "📰Новости📰", callback_data: "newsChanel"
                }
            ],
            [
                {
                    text: "💰Баланс💰", callback_data: "balance"
                },
                {
                    text: '🏦Калькулятор🏦', callback_data: "calculator"
                }
            ]
        ]
    }
}
const againMenu = {
    reply_markup: {
        keyboard: [
            [{ text: 'Вызвать меню' }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
    }
}

bot.onText(/\/addbalance (\d+) (\d+)/, (msg, match) => {
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
});
bot.onText(/\/minusbalance (\d+) (\d+)/, (msg, match) => {
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
});
bot.onText(/\/blockuser (\d+)/, (msg, match) => {
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
});


function blockUser(userId, callback) {
    db.run(
        `UPDATE users SET isBlocked = 1 WHERE userId = ?`,
        [userId],
        function (err) {
            if (err) {
                console.error(err.message);
                callback({ success: false });
            } else {
                callback({ success: true });
            }
        }
    );
}

function isAdminUser(userId) {
    const adminUserIds = [809124390, 789012];
    return adminUserIds.includes(userId);
}

function increaseUserBalance(userId, amount, callback) {
    db.run(
        `UPDATE users SET userBalance = userBalance + ? WHERE userId = ?`,
        [amount, userId],
        function (err) {
            if (err) {
                console.error(err.message);
                callback({ success: false });
            } else {
                callback({ success: true });
            }
        }
    );
}

function minusUserBalance(userId, amount, callback) {
    db.run(
        `UPDATE users SET userBalance = userBalance + ? WHERE userId = ?`,
        [amount, userId],
        function (err) {
            if (err) {
                console.error(err.message);
                callback({ success: false });
            } else {
                callback({ success: true });
            }
        }
    );
}



bot.onText(/\/support/, (msg) => {
    const chatId = msg.chat.id;

    // Отправка приветственного сообщения от технической поддержки
    bot.sendMessage(chatId, 'Добро пожаловать в службу технической поддержки. Как мы можем вам помочь?');
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    // Проверка, что сообщение пришло от пользователя
    if (msg.from && !msg.from.is_bot) {
        const userMessage = msg.text;

        // Обработка сообщения пользователя
        handleUserMessage(chatId, userMessage);
    }
});

function handleUserMessage(chatId, message) {
    // Здесь вы можете добавить логику обработки сообщения пользователя
    // и предоставить соответствующий ответ или рекомендации от технической поддержки.
    // Например, вы можете сохранять сообщения пользователя в базе данных для дальнейшей обработки.

    // Пример обработки сообщений пользователя
    if (message.toLowerCase().includes('проблема')) {

        bot.sendMessage(chatId, 'Кажется, у вас возникла проблема. Мы постараемся помочь вам в ближайшее время.',);

    } else if (message.toLowerCase().includes('вопрос')) {
        bot.sendMessage(chatId, 'Если у вас есть вопрос, с удовольствием на него ответим.');
    } else {
        bot.sendMessage(chatId, 'Спасибо за ваше сообщение! Мы свяжемся с вами в ближайшее время.');
    }
}

bot.on('polling_error', (error) => {
    console.log(error);
});

async function sendToRabbitMQ(message) {
    try {
        const connection = await amqp.connect('amqp://YOUR_RABBITMQ_URL');
        const channel = await connection.createChannel();

        const queue = 'YOUR_QUEUE_NAME';
        const messageBuffer = Buffer.from(message);

        channel.assertQueue(queue);
        channel.sendToQueue(queue, messageBuffer);

        console.log('Message sent to RabbitMQ');
    } catch (error) {
        console.error('Failed to send message to RabbitMQ', error);
    }
}