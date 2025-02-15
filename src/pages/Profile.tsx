export default function Profile() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto space-y-8 px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 rounded-full bg-gray-300"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Name</h1>
              <p className="text-gray-600">user@email.com</p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Profile Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  type="text"
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value="username"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value="user@email.com"
                  readOnly
                />
              </div>
            </div>
            <button className="mt-6 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition duration-150 ease-in-out">
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
