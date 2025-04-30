export default function UvScrap() {
    return (
        <div className="flex justify-between space-y-2">
                <iframe
                    src={`http://dmksrv02:443/uvscrap`}
                    className="w-full h-screen"
                    allowFullScreen 
                ></iframe>

            </div>
    )
}