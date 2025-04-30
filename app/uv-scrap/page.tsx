export default function UvScrap() {
    return (
        <div className="flex justify-between space-y-2">
                <iframe
                    src={`http://localhost:5000`}
                    className="w-full h-screen"
                    allowFullScreen 
                ></iframe>

            </div>
    )
}