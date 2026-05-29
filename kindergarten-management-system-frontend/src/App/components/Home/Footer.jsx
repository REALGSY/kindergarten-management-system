function Footer() {
  return (
    <div className="border-t border-solid bg-[#B124A3] mt-4 py-2">
      <div className=" px-4 mx-auto">
        <div className="md:flex md:-mx-4 md:items-center">
          <div className="md:flex-1 md:px-4 text-center md:text-left">
            <p className="text-white">
              &copy; <strong>版权所有 2022</strong>
            </p>
          </div>
          <div className="md:flex-1 md:px-4 text-center md:text-right">
            <a
              href="/terms"
              className="py-2 px-4 text-white inline-block hover:underline">
              服务条款
            </a>
            <a
              href="/privacy"
              className="py-2 px-4 text-white inline-block hover:underline">
              隐私政策
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Footer;
