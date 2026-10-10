# [RFF] Live Transfer — sign bot

## Установка
1. Node.js 18+ → `npm install`
2. Скопируй `.env.example` в `.env` и заполни.
3. Discord Developer Portal → Bot → включи **Server Members Intent**.
4. Пригласи бота со scope `bot` + `applications.commands` и правом Manage Roles.
   Роль бота должна быть ВЫШЕ ролей команд, менеджера и ассистента.
5. `npm run deploy` (регистрация команд) → `npm start`
6. Аватарка: `npm run avatar` (ставит logo.png)

## Команды
/add_team /appoint — админы
/assistant_appoint — менеджер
/offer /release /transfer — менеджер и ассистент
/roster /info — все
