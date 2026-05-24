import React from 'react'
const SharePopup = ({showSharePopup,setShowSharePopup,copyLink,shareLink}) => {
  return (<>
    {showSharePopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm ">
          <div className="bg-white p-6 rounded-xl shadow-xl text-black space-y-4 max-w-sm w-full ">
            <h2 className="text-xl font-bold">Share this Deck</h2>
            <p>Send this link to friends or colleagues:</p>
            <div className="flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700 text-sm ml-1">
                Include PDF file
              </span>
            </div>
            <div className="flex items-center justify-between border rounded px-2 py-1">
              <span className="text-sm text-gray-800 truncate">
                {shareLink}
              </span>
              <button
                onClick={copyLink}
                className="ml-2 px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Copy
              </button>
            </div>
            <button
              onClick={() => setShowSharePopup(false)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}</>
  )
}
export default SharePopup