
require './pcp.rb'
require 'uri'
require 'webrick'
require 'cgi'
require 'pp'

module PCP
  class RootServer
    AgentName = File.basename(__FILE__)
    Channel = Struct.new(:channel_id, :broadcast_id, :info, :track, :hosts)
    Packet  = Struct.new(:position,   :data)
    Host    = Struct.new(:session_id, :broadcast_id, :agent, :ip, :port, :version, :vp_version, :info)
    def initialize(host, port, agent_name=AgentName)
      @host = host
      @port = port
      @channels = {}
      @agent_name = agent_name

      @session_id = GID.generate
      @server = TCPServer.open(host, port)
      @closed = false
      @client_threads = []
      @server_thread = Thread.new {
        until @closed do
          ss = IO.select([@server], [], [], 0.1)
          if ss then
            client = @server.accept
            @client_threads << Thread.new {
              begin
                process_client(client)
              rescue System::Net::Sockets::SocketException => e
              rescue System::IO::IOException => e
              rescue System::ObjectDisposedException => e
              ensure
                begin
                  client.flush
                  client.close_read
                  client.close_write
                  client.close unless client.closed?
                rescue System::ObjectDisposedException
                rescue System::IO::IOException
                end
              end
            }
          end
        end
        @server.close
      }

      server = WEBrick::HTTPServer.new({:BindAddress => '0.0.0.0',
                                        :Port => 10080})
      trap(:INT){server.shutdown}
      server.mount_proc('/') {|req, res|
        res['Content-Type'] = 'text/plain'
        # index.txt
        res.body = [
          "DP - お知らせ",
          "00000000000000000000000000000000",
          "",
          "http://yy59.60.kg/test/read.cgi/progre/1260118120/",
          "試験運用中",
          "",
          "-9",
          "-9",
          "0",
          "RAW",
          "",
          "",
          "",
          "",
          CGI.escape("DP - お知らせ"),
          "0:00",
          "click",
          "意見要望不具合報告等はコンタクトURLへ",
          "0"
        ].join("<>") + "\r\n"
        @channels.each do |key, channel| 
          info_children = channel.info.children
          host_children = channel.hosts.values[0].info.children
          track_children = channel.track.children
          p track_children
          res.body += [
            info_children[0].value, # チャンネル名
            channel.channel_id, # チャンネルID
            host_children[2].value.join(".") + ":" + host_children[3].value.to_s, # IP:Port
            info_children[3].value, # コンタクトURL
            info_children[2].value, # ジャンル
            info_children[4].value, # 詳細
            host_children[6].value, # 視聴数
            host_children[7].value, # リレー数
            info_children[1].value.to_s, # ビットレート
            info_children[6].value.split(//u)[0..-2].join, # 形式 最後の文字を削除
            track_children[1].value, # アーティスト
            track_children[3].value, # アルバム
            track_children[0].value, # タイトル
            track_children[2].value, # URL
            CGI.escape(info_children[0].value),
            Time.at(host_children[9].value).strftime("%R"),
            "click",
            info_children[5].value,
            0.to_s
          ].join("<>") + "\r\n"
        end
      }
      server.start

    end
    attr_reader :host, :port, :session_id, :client_threads
    attr_accessor :channels

    def close
      @closed = true
      @server_thread.join
      @client_threads.each(&:join)
    end

    HTTPRequest = Struct.new(:method, :uri, :version, :headers)
    PCPRequest = Struct.new(:version)
    def parse_http_header(header)
      header = header.split(/\r\n/)
      line = header.shift
      if /(GET|HEAD) ([\/\w]+) HTTP\/(1.\d)/=~line then
        method  = $1
        uri     = URI.parse($2)
        version = $3
        headers = {}
        while line=header.shift and line!='' do
          md = /(.*?):(.*)/.match(line)
          headers[md[1].strip.downcase] = md[2].strip
        end
        HTTPRequest.new(method, uri, version, headers)
      else
        raise RuntimeError, "Invalid request: #{line}"
      end
    end

    def read_header(io)
      header = io.read(4)
      if header=="pcp\n" then
        len = io.read(4).unpack('V')[0]
        raise "Length Error: #{len}" unless len==4
        PCPRequest.new(io.read(4).unpack('V')[0])
      else
        until /\r\n\r\n$/=~header do
          header << io.read(1)
        end
        parse_http_header(header)
      end
    end

    def pcp_ping(session_id, addr, port)
      begin
        ping_sock = TCPSocket.open(addr, port)
        PCP::Atom.new("pcp\n", nil, [1].pack('V')).write(ping_sock)
        helo = PCP::Atom.new(PCP::HELO, [], nil)
        helo[PCP::HELO_SESSIONID] = @session_id
        helo.write(ping_sock)
        oleh = PCP::Atom.read(ping_sock)
        return oleh[PCP::HELO_SESSIONID]==session_id ? port : 0
      rescue
        return 0
      ensure
        ping_sock.close if ping_sock
      end
    end

    def on_helo(sock, atom)
      host = Host.new
      host.session_id   = atom[PCP::HELO_SESSIONID]
      host.broadcast_id = atom[PCP::HELO_BCID]
      host.agent        = atom[PCP::HELO_AGENT]
      host.ip           = sock.peeraddr[3]
      host.version      = atom[PCP::HELO_VERSION]
      if atom[PCP::HELO_PING] then
        host.port = pcp_ping(host.session_id, sock.peeraddr[3], atom[PCP::HELO_PING])
      else
        host.port = atom[PCP::HELO_PORT] || 0
      end
      oleh = PCP::Atom.new(PCP::OLEH, [], nil)
      oleh[PCP::HELO_AGENT]     = @agent_name
      oleh[PCP::HELO_SESSIONID] = @session_id
      oleh[PCP::HELO_VERSION]   = 1218
      oleh[PCP::HELO_REMOTEIP]  = sock.peeraddr[3]
      oleh[PCP::HELO_PORT]      = port
      oleh.write(sock)
      host
    end

    def on_bcst(sock, host, atom)
      atom.children.each do |c|
        case c.name
        when PCP::BCST_TTL
        when PCP::BCST_HOPS
        when PCP::BCST_FROM
        when PCP::BCST_DEST
        when PCP::BCST_GROUP
        when PCP::BCST_CHANID
        when PCP::BCST_VERSION
        when PCP::BCST_VERSION_VP
        else
          process_atom(sock, host, c)
        end
      end
    end

    def on_host(sock, host, atom)
      session_id = atom[PCP::HOST_ID]
      channel_id = atom[PCP::HOST_CHANID]
      channel = @channels[channel_id]
      if host.session_id.to_s==session_id.to_s and channel then
        channel.hosts[session_id] = host
        channel.hosts[session_id].vp_version = atom[PCP::HOST_VERSION_VP]
        channel.hosts[session_id].info = atom
      end
    end

    def on_chan(sock, host, atom)
      channel_id = atom[PCP::CHAN_ID]
      channel = @channels[channel_id]
      if channel.nil? and host.broadcast_id then
        channel = Channel.new(channel_id, host.broadcast_id, nil, nil, {})
        @channels[channel_id] = channel
      end
      if not channel.nil? and channel.broadcast_id==host.broadcast_id then
        info = atom[PCP::CHAN_INFO]
        if info and channel.info then
          channel.info.update(info)
        elsif info then
          channel.info = info
        end
        track = atom[PCP::CHAN_TRACK]
        if track and channel.track then
          channel.track.update(track)
        elsif track then
          channel.track = track
        end
      end
    end

    class PCPQuitError < RuntimeError
    end

    def on_quit(sock, host, atom)
      raise PCPQuitError, "Quit Received"
    end

    def process_atom(sock, host, atom)
      return unless atom
      case atom.name
      when PCP::BCST; on_bcst(sock, host, atom)
      when PCP::HOST; on_host(sock, host, atom)
      when PCP::CHAN; on_chan(sock, host, atom)
      when PCP::QUIT; on_quit(sock, host, atom)
      end
    end

    class HTTPRequestError < RuntimeError
      def initialize(status, msg)
        super(msg)
        @status = status
      end
      attr_reader :status
    end

    def process_client_http(request, sock)
      raise HTTPRequestError.new(400, 'Bad Request') unless request.headers['x-peercast-pcp']=='1'
      raise HTTPRequestError.new(404, 'Not Found')   unless %r;^/channel/([A-Fa-f0-9]{32});=~request.uri.path
      channel_id = GID.from_string($1)
      channel = @channels[channel_id]
      raise HTTPRequestError.new(404, 'Not Found')   unless channel
      sock.write([
        "HTTP/1.0 503 Unavailable",
        "Server: #{@agent_name}",
        "Content-Type:application/x-peercast-pcp",
        "x-peercast-pcp:1",
        ""
      ].join("\r\n")+"\r\n")
      helo = PCP::Atom.read(sock)
      raise RuntimeError, "Handshake failed" unless helo.name==PCP::HELO
      on_helo(sock, helo)
      hosts[0,8].each do |host|
        host.write(sock)
      end
      PCP::Atom.new(PCP::QUIT, nil, [PCP::ERROR_UNAVAILABLE+PCP::ERROR_QUIT].pack('V')).write(sock)
    rescue HTTPRequestError => e
      sock.write([
        "HTTP/1.0 #{e.status} #{e.message}",
        "Server: #{@agent_name}",
        ""
      ].join("\r\n")+"\r\n")
    rescue PCPQuitError
    end

    class PCPError < RuntimeError
      def initialize(msg, quit)
        super(msg)
        @quit = quit
      end
      attr_reader :quit
    end

    def process_client_pcp(request, sock)
      raise PCPError.new('Unknown PCP Version', PCP::ERROR_QUIT+PCP::ERROR_GENERAL) unless request.version==1
      helo = PCP::Atom.read(sock)
      raise PCPError.new('Handshake failed', PCP::ERROR_QUIT+PCP::ERROR_GENERAL) unless helo.name==PCP::HELO
      host = on_helo(sock, helo)
      until @closed do
        if IO.select([sock], [], [], 0.1) then
          process_atom(sock, host, PCP::Atom.read(sock))
        end
      end
      PCP::Atom.new(PCP::QUIT, nil, [PCP::ERROR_QUIT+PCP::ERROR_SHUTDOWN].pack('V')).write(sock)
    rescue PCPError
      PCP::Atom.new(PCP::QUIT, nil, [e.quit].pack('V')).write(sock)
    rescue PCPQuitError
    ensure
      if host and host.broadcast_id then
        @channels.delete_if {|channel_id, channel| channel.broadcast_id==host.broadcast_id }
      end
    end

    def process_client(sock)
      request = read_header(sock)
      case request
      when PCPRequest
        process_client_pcp(request, sock)
      when HTTPRequest
        process_client_http(request, sock)
      else
        #Do nothing
      end
    end

    def process_http_client(sock)
      request = read_header(sock)
      case request
      when PCPRequest
        process_client_pcp(request, sock)
      when HTTPRequest
        sock.write([
          "HTTP/1.0 200 OK",
          "Server: #{@agent_name}",
          "Content-Type:text/plain",
          "",
          "test",
        ].join("\r\n")+"\r\n")
        hosts[0,8].each do |host|
          host.write(sock)
        end
      else
        #Do nothing
      end
    rescue HTTPRequestError => e
      sock.write([
        "HTTP/1.0 #{e.status} #{e.message}",
        "Server: #{@agent_name}",
        ""
      ].join("\r\n")+"\r\n")
    rescue PCPQuitError
    end
  end
end

if __FILE__==$0 then
  server = PCP::RootServer.new('0.0.0.0', 7144, 'DVYP')
  sleep(0.1) until gets
  server.close
end
