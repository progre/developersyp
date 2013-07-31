require 'nkf'

text_ascii = "RAW".encode("ascii").unpack("C*").pack("C*")

p NKF.guess(text_ascii)
def ascii_to_utf8(ascii)
	case NKF.guess(ascii)
	when NKF::SJIS
		ascii.force_encoding("sjis").encode("UTF-8")
	when NKF::UTF8
		ascii.force_encoding("UTF-8")
	else
		"(format not supported)"
	end
end
