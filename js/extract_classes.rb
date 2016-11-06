require "fileutils"

class LineSemantics
  def initialize(line)
    @line = line
  end

  def class_definition
    matching = @line.match /^ *function ([^(]+)/
    matching && matching[1]
  end

  def comment_beginning_class?
    @line.strip =~ /^\/\/-{6,}/
  end
end

def extract_classes_from(lines)
  classes = []

  comments = []
  lines.each do |line|
    semantic = LineSemantics.new line
    if semantic.comment_beginning_class?
      classes.push(name: nil, lines: [])
    elsif !classes.empty?
      classes.last[:lines].push line
      classes.last[:name] ||= semantic.class_definition
    end
  end

  classes
end

Dir.glob("./rpg_*.js").each do |filepath|
  master_script_name = File.basename(filepath, ".js")
  master_script_content = File.readlines filepath
  FileUtils.rm_r master_script_name if File.exist? master_script_name
  FileUtils.mkdir master_script_name

  puts "\n\n\n\n=> "
  puts master_script_name

  classes = extract_classes_from master_script_content
  classes.each_with_index do |class_def, i|
    puts class_def[:name]
    filename = "%.2d_%s.js" % [i, class_def[:name]]
    class_path = File.join(master_script_name, filename)
    File.open(class_path, "w"){|f| f.write class_def[:lines].join}
  end
end
