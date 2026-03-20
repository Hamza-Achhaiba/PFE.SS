package ma.smartsupply.dto;

public class ChatResponse {
    private String reply;
    private boolean error;
    private String errorMessage;

    public ChatResponse() {
    }

    public ChatResponse(String reply) {
        this.reply = reply;
        this.error = false;
    }

    public ChatResponse(String reply, boolean error, String errorMessage) {
        this.reply = reply;
        this.error = error;
        this.errorMessage = errorMessage;
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public boolean isError() {
        return error;
    }

    public void setError(boolean error) {
        this.error = error;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
}
