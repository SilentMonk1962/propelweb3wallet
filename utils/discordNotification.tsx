type DiscordNotificationPayload = {
    userId: number;
    service: string;
    errorMessage: string;
    userEmail: string;
};

export async function sendDiscordNotification(payload: DiscordNotificationPayload) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
        console.error('Discord webhook URL is not set');
        return;
    }

    const body = {
        content: "Hey, Something broke within Propel server.",
        embeds: [
            {
                title: "USD Deposit NextJS service is down",
                description: "Please visit [Xano](https://app.xano.com) to resolve this issue.",
                color: 10031666,
                fields: [
                    {
                        name: "Impacted user_id",
                        value: payload.userId.toString()
                    },
                    {
                        name: "Impacted service",
                        value: payload.service
                    },
                    {
                        name: "Error date time",
                        value: new Date().toUTCString()
                    },
                    {
                        name: "Error message",
                        value: payload.errorMessage
                    },
                    {
                        name: "Concerning user email",
                        value: payload.userEmail
                    }
                ],
                author: {
                    name: "Service_monitor"
                }
            }
        ]
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`Discord notification failed: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Failed to send Discord notification:', error);
    }
}