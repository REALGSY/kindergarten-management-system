import React from "react";
import { SYSTEM_NAME } from "../../brand";

function Homepage() {
  return (
    <div className="">
      <div className="px-6  mx-auto">
        <div className="flex flex-col text-center w-full mb-8">
          <span className="sm:text-3xl font-medium title-font bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">
            快乐学习，一起启航
          </span>
        </div>
        <div className="flex flex-wrap -m-4">
          <div className="p-4 md:w-1/3">
            <div className="flex rounded-lg h-full bg-gray-100 p-8 flex-col">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 mr-3 inline-flex items-center justify-center rounded-full bg-[#B124A3] text-white flex-shrink-0">
                  <svg
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                </div>
                <h2 className="text-[#B124A3] text-lg title-font font-medium">
                  我们的愿景
                </h2>
              </div>
              <div className="flex-grow">
                <p className="leading-relaxed text-base">
                  以信任和尊重为基础，建立积极而有爱的关系，是我们教育理念的核心。
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 md:w-1/3">
            <div className="flex rounded-lg h-full bg-gray-100 p-8 flex-col">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 mr-3 inline-flex items-center justify-center rounded-full bg-[#B124A3] text-white flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                    />
                  </svg>
                </div>
                <h2 className="text-[#B124A3] text-lg title-font font-medium">
                  我们的使命
                </h2>
              </div>
              <div className="flex-grow">
                <p className="leading-relaxed text-base">
                  在 {SYSTEM_NAME}，我们相信每天都是学习日，学习就在孩子身边。这里不仅是学习的地方，也是充满关爱与尊重的环境，让每个孩子都被重视、被倾听。
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 md:w-1/3">
            <div className="flex rounded-lg h-full bg-gray-100 p-8 flex-col">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 mr-3 inline-flex items-center justify-center rounded-full bg-[#B124A3] text-white flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
                    />
                  </svg>
                </div>
                <h2 className="text-[#B124A3] text-lg title-font font-medium">
                  我们的格言
                </h2>
              </div>
              <div className="flex-grow">
                <p className="leading-relaxed text-base">
                  打造像家一样温暖、互相支持的幼儿园环境，陪伴孩子和家庭共同成长。
                </p>
              </div>
            </div>
          </div>
          {/* comment section */}
        </div>
      </div>
    </div>
  );
}

export default Homepage;
