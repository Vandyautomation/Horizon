
module.exports = {
    apps: [
        {
            name: 'qco-api',
            script: 'bun',
            // script: 'C:/Users/Information-systemD/.bun/bin/bun.exe',
            cwd: 'D:/Countboard/next-hono-admin-ui',
            args: 'api/index_qco.ts',
            env: {
                DB_DRIVER: 'sqlserver',
                DB_HOST: '10.160.50.15',
                DB_PORT: 1433,
                DB_NAME: 'IoT',
                DB_USER: 'UserIoT',
                DB_PASSWORD: "AdminIoT#",
                BE_PORT: 9999,
                NEXT_PUBLIC_GRAFANA_HOST: "http://dmksrv02:3000",
                NEXT_PUBLIC_GRAFANA_STATE: "http://dmksrv02:3000/d-solo/downuptime/down-and-up-time",
                NEXT_PUBLIC_BACKEND_URL: 'http://dmksrv02:443/be',
                NEXT_PUBLIC_MQTT_WS: 'ws://dmksrv02:443/mqtt/',
                JWT_SECRET: "6mdoFtFqRkhvBYbcdLgQf00DcIeL+FNZp+n3QMso3QE=",
                NEXT_PUBLIC_BACKEND_PYTHON: "http://10.160.50.14:5000"

                // or any other envs you rely on
            },
        },
    ],
};
