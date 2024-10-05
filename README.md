This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


Deploying a Next.js Application with PM2, Nginx, and Cloudflare
This guide provides step-by-step instructions for deploying a Next.js application to a production environment using PM2, Nginx, and Cloudflare. It covers setting up environment variables, configuring PM2 for process management, setting up Nginx as a reverse proxy, and resolving common issues encountered during deployment.

Table of Contents
Prerequisites
Project Setup
Environment Variables Configuration
PM2 Configuration
Updating package.json Scripts
Installing Dependencies
Starting the Application
Development Mode
Production Mode
Configuring Nginx as a Reverse Proxy
DNS Configuration with Cloudflare
SSL/TLS Configuration
Managing the Application with PM2
Common Pitfalls and Resolutions
Environment Variables Not Accessible
Application Not Running
DNS Misconfiguration
Nginx Configuration Issues
Cloudflare Proxy Issues
Conclusion
Prerequisites
Server with SSH Access: A Linux-based server (e.g., Ubuntu) with root or sudo privileges.

Node.js and npm Installed: Ensure you have Node.js (version 14 or higher) and npm installed on your server.

PM2 Installed Globally: Install PM2 process manager globally:

bash
Copy code
npm install pm2@latest -g
Nginx Installed: Install Nginx web server:

bash
Copy code
sudo apt update
sudo apt install nginx
Domain Name and DNS Management: Access to a domain name and the ability to manage DNS records (e.g., through Cloudflare).

Project Setup
Clone Your Repository:

bash
Copy code
git clone https://github.com/yourusername/your-nextjs-app.git /path/to/your-app
cd /path/to/your-app
Install Dependencies:

bash
Copy code
npm install
Environment Variables Configuration
Next.js requires environment variables to be set during the build time for variables used in the client-side code (prefixed with NEXT_PUBLIC_). Server-side variables can be set at runtime.

Understanding Environment Variables in Next.js
NEXT_PUBLIC_* Variables: Exposed to both the server and the client. Must be set during the build process.
Server-Side Variables: Available only on the server side and can be set at runtime.
PM2 Configuration
Create an ecosystem.config.js file in the root of your project to configure PM2 for both development and production environments.

javascript
Copy code
// ecosystem.config.js
module.exports = {
  apps: [
    // Development environment
    {
      name: 'your-app-dev',
      script: 'npm',
      args: 'run dev',
      cwd: '/path/to/your-app', // Update this path to your app's root directory
      env: {
        NODE_ENV: 'development',
        NEXT_PUBLIC_PROJECT_ID: 'your_dev_project_id',
        NEXT_PUBLIC_API_ENDPOINT: 'https://dev-api.example.com',
        API_SECRET_KEY: 'your_dev_secret_key',
      },
    },
    // Production environment
    {
      name: 'your-app-prod',
      script: 'npm',
      args: 'run build-and-start',
      cwd: '/path/to/your-app', // Update this path to your app's root directory
      env: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_PROJECT_ID: 'your_prod_project_id',
        NEXT_PUBLIC_API_ENDPOINT: 'https://api.example.com',
        API_SECRET_KEY: 'your_prod_secret_key',
      },
    },
  ],
};
Note: Replace the placeholder values with your actual environment variables. Ensure that cwd points to the correct application directory.

Updating package.json Scripts
Add custom scripts to your package.json to streamline the build and start process.

json
Copy code
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "build-and-start": "npm run build && npm run start"
  }
}
Installing Dependencies
Ensure all dependencies are installed:

bash
Copy code
npm install
Starting the Application
Development Mode
Start the application in development mode:

bash
Copy code
pm2 start ecosystem.config.js --only your-app-dev
Access the Application:

Open your browser and navigate to http://your_server_ip:3000.
Production Mode
Build and start the application in production mode:

bash
Copy code
pm2 start ecosystem.config.js --only your-app-prod
Access the Application:

After configuring Nginx and DNS, access the application via http://your_subdomain.yourdomain.com.
Configuring Nginx as a Reverse Proxy
Create a new Nginx server block to proxy requests to your application.

Create Nginx Configuration File:

bash
Copy code
sudo nano /etc/nginx/sites-available/your-app
Add the Following Configuration:

nginx
Copy code
server {
    listen 80;
    server_name your_subdomain.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
Enable the Configuration and Restart Nginx:

bash
Copy code
sudo ln -s /etc/nginx/sites-available/your-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
DNS Configuration with Cloudflare
Add an A Record in Cloudflare:

Type: A
Name: your_subdomain (e.g., app)
IPv4 Address: Your server's IP address
TTL: Auto
Proxy Status: Proxied (orange cloud)
Wait for DNS Propagation:

It may take a few minutes for the DNS changes to take effect.
SSL/TLS Configuration
To secure your application with HTTPS, you can use Cloudflare's SSL/TLS services.

Set SSL/TLS Encryption Mode:

In Cloudflare's dashboard, navigate to SSL/TLS.
Choose Full or Full (strict) if you have SSL certificates installed on your server.
Obtain SSL Certificates (If Needed):

You can use Let's Encrypt to obtain free SSL certificates:

bash
Copy code
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your_subdomain.yourdomain.com
Update Nginx Configuration for SSL:

nginx
Copy code
server {
    listen 443 ssl;
    server_name your_subdomain.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/your_subdomain.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your_subdomain.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name your_subdomain.yourdomain.com;
    return 301 https://$host$request_uri;
}
Reload Nginx:

bash
Copy code
sudo nginx -t
sudo systemctl reload nginx
Managing the Application with PM2
Common PM2 commands:

List Processes:

bash
Copy code
pm2 list
View Logs:

bash
Copy code
pm2 logs your-app-prod
Restart Application:

bash
Copy code
pm2 restart your-app-prod
Stop Application:

bash
Copy code
pm2 stop your-app-prod
Set PM2 to Start on Boot:

bash
Copy code
pm2 startup systemd
pm2 save
Common Pitfalls and Resolutions
Environment Variables Not Accessible
Issue: Environment variables are not available during build or runtime.

Resolution:

Ensure NEXT_PUBLIC_* variables are set in the environment during the build process.
Use PM2's env configuration in ecosystem.config.js to set variables for both build and runtime.
Verify that variables are correctly prefixed with NEXT_PUBLIC_ if they need to be exposed to the client.
Application Not Running
Issue: The application is not running or accessible.

Resolution:

Check PM2 process status:

bash
Copy code
pm2 list
View application logs for errors:

bash
Copy code
pm2 logs your-app-prod
Ensure all dependencies are installed and the build process completed successfully.

DNS Misconfiguration
Issue: The domain or subdomain is not pointing to the server.

Resolution:

Verify DNS records in Cloudflare or your DNS provider.
Use nslookup or dig to confirm that the domain resolves to your server's IP address.
Nginx Configuration Issues
Issue: Nginx is not correctly proxying requests to the application.

Resolution:

Check Nginx configuration syntax:

bash
Copy code
sudo nginx -t
Ensure the server_name matches your subdomain.

Verify that the proxy_pass directive points to the correct application port.

Reload Nginx after making changes:

bash
Copy code
sudo systemctl reload nginx
Cloudflare Proxy Issues
Issue: Errors due to Cloudflare's proxy settings.

Resolution:

Temporarily set the Proxy status to DNS Only to bypass Cloudflare and test your application.
Adjust SSL/TLS encryption mode in Cloudflare to match your server's SSL configuration.
Clear Cloudflare's cache if necessary.
Conclusion
By following this guide, you should have a Next.js application successfully deployed to a production environment with PM2 managing the process, Nginx serving as a reverse proxy, and Cloudflare handling DNS and SSL/TLS. Remember to keep sensitive information secure by not committing files like ecosystem.config.js to version control and adding them to your .gitignore.

For any issues not covered in this guide, consider consulting the official documentation for Next.js, PM2, Nginx, and Cloudflare, or seek assistance from the community.

